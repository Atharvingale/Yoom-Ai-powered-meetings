/* eslint-disable camelcase */
import { AIProvider, MeetingSummaryResult, SummarizeOptions } from './provider';
import { SUMMARIZATION_SYSTEM_PROMPT, REDUCE_SUMMARY_PROMPT } from './prompts';

export class OllamaLocalProvider implements AIProvider {
  name = 'ollama-local';

  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || '';
  }

  private async resolveModel(requestedModel?: string): Promise<string> {
    if (requestedModel) return requestedModel;
    if (this.defaultModel) return this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          return data.models[0].name || data.models[0].model || 'llama3.2';
        }
      }
    } catch {
      // Fallback if tags query fails
    }

    return 'qwen3:8b';
  }

  async summarize(
    transcriptText: string,
    segments?: Array<{ speaker_label?: string | null; text: string }>,
    options?: SummarizeOptions
  ): Promise<MeetingSummaryResult> {
    const model = await this.resolveModel(options?.model);
    const cleanText = transcriptText ? transcriptText.trim() : '';

    // Handle empty or very short transcript (fewer than 15 words)
    if (!cleanText || cleanText.split(/\s+/).length < 15) {
      return {
        overview: cleanText ? `Brief discussion: ${cleanText}` : 'No transcript content recorded for this meeting.',
        provenance: 'explicit',
        action_items: [],
        decisions: [],
        open_questions: [],
        model,
      };
    }

    const maxChars = options?.maxChunkCharacters || 12000;
    if (cleanText.length > maxChars) {
      return await this.summarizeInChunks(cleanText, model, maxChars);
    }

    return await this.generateAndValidate(cleanText, SUMMARIZATION_SYSTEM_PROMPT, model);
  }

  private async summarizeInChunks(
    text: string,
    model: string,
    chunkSize: number
  ): Promise<MeetingSummaryResult> {
    const chunks: string[] = [];
    let currentPos = 0;
    while (currentPos < text.length) {
      chunks.push(text.slice(currentPos, currentPos + chunkSize));
      currentPos += chunkSize;
    }

    const subSummaries: MeetingSummaryResult[] = [];
    for (const chunk of chunks) {
      const sub = await this.generateAndValidate(chunk, SUMMARIZATION_SYSTEM_PROMPT, model);
      subSummaries.push(sub);
    }

    const combinedSubText = JSON.stringify(subSummaries, null, 2);
    return await this.generateAndValidate(
      `Combine the following sub-summaries:\n${combinedSubText}`,
      REDUCE_SUMMARY_PROMPT,
      model
    );
  }

  private async generateAndValidate(
    inputText: string,
    systemPrompt: string,
    model: string,
    isRetry = false
  ): Promise<MeetingSummaryResult> {
    const prompt = isRetry
      ? `${systemPrompt}\n\nWARNING: Your previous response was invalid JSON. Return ONLY a valid JSON object matching the schema.\n\nTRANSCRIPT:\n${inputText}`
      : `${systemPrompt}\n\nTRANSCRIPT:\n${inputText}`;

    const rawResponse = await this.callOllama(prompt, model);
    const parsed = this.parseJSON(rawResponse);

    if (parsed) {
      const validated = this.validateAndNormalize(parsed, model);
      if (validated) return validated;
    }

    if (!isRetry) {
      return await this.generateAndValidate(inputText, systemPrompt, model, true);
    }

    throw new Error(`[OllamaLocalProvider] Failed schema validation after retry for model ${model}`);
  }

  private async callOllama(prompt: string, model: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API call failed: HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.response || '';
  }

  private parseJSON(text: string): Record<string, unknown> | null {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private validateAndNormalize(
    obj: Record<string, unknown>,
    model: string
  ): MeetingSummaryResult | null {
    if (typeof obj.overview !== 'string') return null;

    const provenanceValues = ['explicit', 'inferred', 'mixed'];
    const provenance = provenanceValues.includes(String(obj.provenance))
      ? (String(obj.provenance) as 'explicit' | 'inferred' | 'mixed')
      : 'mixed';

    const action_items = Array.isArray(obj.action_items)
      ? obj.action_items
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            task: String(item.task || ''),
            assignee: item.assignee && item.assignee !== 'null' ? String(item.assignee) : undefined,
            context: item.context ? String(item.context) : undefined,
            status: item.status === 'done' ? ('done' as const) : ('open' as const),
          }))
          .filter((i) => i.task.length > 0)
      : [];

    const decisions = Array.isArray(obj.decisions)
      ? obj.decisions
          .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null)
          .map((d) => ({
            decision: String(d.decision || ''),
            context: d.context ? String(d.context) : undefined,
          }))
          .filter((d) => d.decision.length > 0)
      : [];

    const open_questions = Array.isArray(obj.open_questions)
      ? obj.open_questions
          .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
          .map((q) => ({
            question: String(q.question || ''),
            context: q.context ? String(q.context) : undefined,
          }))
          .filter((q) => q.question.length > 0)
      : [];

    return {
      overview: obj.overview,
      provenance,
      action_items,
      decisions,
      open_questions,
      model,
    };
  }
}
