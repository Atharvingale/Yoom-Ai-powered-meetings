import { WhisperLocalProvider } from './whisper-local';
import { TranscriptionProvider, TranscriptionResult } from './provider';
import { saveTranscript } from '../supabase/transcripts';

export * from './provider';
export * from './diarization';
export * from './whisper-local';

export async function processMeetingTranscription(
  meetingId: string,
  recordingUrl: string,
  provider?: TranscriptionProvider
): Promise<TranscriptionResult> {
  const activeProvider = provider || new WhisperLocalProvider();

  try {
    const result = await activeProvider.transcribe(recordingUrl, meetingId);

    await saveTranscript({
      meeting_id: meetingId,
      provider: activeProvider.name,
      language: result.language,
      status: 'ready',
      segments: result.segments.map((seg) => ({
        speaker_label: seg.speaker_label ?? undefined,
        start_ms: seg.start_ms,
        end_ms: seg.end_ms,
        text: seg.text,
      })),
    });

    return result;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[TranscriptionError] MeetingID: ${meetingId} | Provider: ${activeProvider.name} | ErrorClass: ${err.constructor.name} | Message: ${err.message}`
    );

    try {
      await saveTranscript({
        meeting_id: meetingId,
        provider: activeProvider.name,
        status: 'failed',
        segments: [],
      });
    } catch (dbError: unknown) {
      const dbErrMessage = dbError instanceof Error ? dbError.message : String(dbError);
      if (!dbErrMessage.includes('Could not find the table')) {
        console.error(
          `[TranscriptionError] Failed to update failed status in DB for meeting ${meetingId}:`,
          dbErrMessage
        );
      }
    }

    throw err;
  }
}
