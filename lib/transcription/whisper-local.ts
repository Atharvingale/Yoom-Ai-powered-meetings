import { TranscriptionProvider, TranscriptionResult, TranscribeOptions, RawSegment } from './provider';
import { mergeDiarization, DiarizationSegment } from './diarization';

export class WhisperLocalProvider implements TranscriptionProvider {
  name = 'faster-whisper-local';

  private sidecarUrl: string;

  constructor(sidecarUrl?: string) {
    this.sidecarUrl = sidecarUrl || process.env.YOOM_SIDECAR_URL || 'http://127.0.0.1:8765';
  }

  async transcribe(
    audioUrl: string,
    meetingId: string,
    options?: TranscribeOptions
  ): Promise<TranscriptionResult> {
    const payload = {
      url: audioUrl,
      meeting_id: meetingId,
      language: options?.language,
      chunk_duration_seconds: options?.chunkDurationSeconds,
    };

    let attempt = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(`${this.sidecarUrl}/infer/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Sidecar HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        let resultData = data;
        if (data.job_id) {
          resultData = await this.pollJob(data.job_id);
        }

        const rawSegments: RawSegment[] = (resultData.result?.transcript || resultData.transcript || []).map(
          (s: { start: number; end: number; text: string; speaker?: string; speaker_label?: string }) => ({
            start_ms: Math.round(s.start * 1000),
            end_ms: Math.round(s.end * 1000),
            text: s.text.trim(),
            speaker_label: s.speaker || s.speaker_label || null,
          })
        );

        let diarizationSegments: DiarizationSegment[] | undefined;
        if (Array.isArray(resultData.result?.diarization || resultData.diarization)) {
          diarizationSegments = (resultData.result?.diarization || resultData.diarization).map(
            (d: { start: number; end: number; speaker: string }) => ({
              start_ms: Math.round(d.start * 1000),
              end_ms: Math.round(d.end * 1000),
              speaker_label: d.speaker,
            })
          );
        }

        const finalSegments = mergeDiarization(rawSegments, diarizationSegments);

        return {
          provider: this.name,
          language: resultData.result?.language || resultData.language || 'en',
          segments: finalSegments,
        };
      } catch (err: unknown) {
        attempt++;
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const isFetchFailed = lastError?.message?.includes('fetch failed') || lastError?.message?.includes('ECONNREFUSED');
    const failureReason = isFetchFailed
      ? `Local AI sidecar is not reachable at ${this.sidecarUrl}. Please start the sidecar service with 'python sidecar/main.py'.`
      : lastError?.message || 'Unknown error';

    throw new Error(
      `[WhisperLocalProvider] Failed after ${maxRetries} attempts for meeting ${meetingId}. ${failureReason}`
    );
  }

  private async pollJob(jobId: string, maxPollSeconds = 300): Promise<{ result?: { transcript?: Array<{ start: number; end: number; text: string }>; diarization?: Array<{ start: number; end: number; speaker: string }>; language?: string }; transcript?: Array<{ start: number; end: number; text: string }>; diarization?: Array<{ start: number; end: number; speaker: string }>; language?: string }> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxPollSeconds * 1000) {
      const res = await fetch(`${this.sidecarUrl}/infer/status/${jobId}`);
      if (!res.ok) {
        throw new Error(`Polling status failed with HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.status === 'completed') {
        return data;
      }
      if (data.status === 'failed') {
        throw new Error(`Sidecar job failed: ${data.error || 'Unknown error'}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(`Polling job ${jobId} timed out after ${maxPollSeconds}s`);
  }
}
