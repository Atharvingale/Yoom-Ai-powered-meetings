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

  const fullText = segments
    .map((s) => {
      const min = Math.floor(s.start_ms / 60000);
      const sec = String(Math.floor((s.start_ms % 60000) / 1000)).padStart(2, '0');
      const timeStr = `[${min.toString().padStart(2, '0')}:${sec}]`;
      const speakerStr = s.speaker_label || 'Speaker';
      return `${timeStr} ${speakerStr}: ${s.text}`;
    })
    .join('\n');

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
