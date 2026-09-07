export interface RawSegment {
  start_ms: number;
  end_ms: number;
  text: string;
  speaker_label?: string | null;
}

export interface TranscriptionResult {
  segments: RawSegment[];
  language?: string;
  provider: string;
}

export interface TranscribeOptions {
  language?: string;
  chunkDurationSeconds?: number;
}

export interface TranscriptionProvider {
  name: string;
  transcribe(
    audioUrl: string,
    meetingId: string,
    options?: TranscribeOptions
  ): Promise<TranscriptionResult>;
}
