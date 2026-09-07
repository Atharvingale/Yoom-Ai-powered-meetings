import { AIProvider, MeetingSummaryResult } from './provider';
import { OllamaLocalProvider } from './ollama-local';
import { saveSummary } from '../supabase/summaries';
import { TranscriptSegmentRecord } from '../supabase/transcripts';

export * from './provider';
export * from './prompts';
export * from './ollama-local';

export async function generateMeetingSummary(
  meetingId: string,
  segments: TranscriptSegmentRecord[],
  provider?: AIProvider
): Promise<MeetingSummaryResult> {
  const activeProvider = provider || new OllamaLocalProvider();

  const fullText = segments.map((s) => (s.speaker_label ? `${s.speaker_label}: ${s.text}` : s.text)).join('\n');

  try {
    const summaryResult = await activeProvider.summarize(fullText, segments);

    await saveSummary({
      meeting_id: meetingId,
      overview: summaryResult.overview,
      model: summaryResult.model,
      action_items: summaryResult.action_items,
      decisions: summaryResult.decisions,
      open_questions: summaryResult.open_questions,
    });

    return summaryResult;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[AISummarizationError] MeetingID: ${meetingId} | Provider: ${activeProvider.name} | Error: ${err.message}`
    );
    throw err;
  }
}
