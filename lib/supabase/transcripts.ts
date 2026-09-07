import { createSupabaseServerClient } from './server';

export interface TranscriptRecord {
  id: string;
  meeting_id: string;
  provider: string;
  language: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
}

export interface TranscriptSegmentRecord {
  id: string;
  transcript_id: string;
  speaker_label: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface SaveTranscriptInput {
  meeting_id: string;
  provider: string;
  language?: string;
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  segments?: Array<{
    speaker_label?: string;
    start_ms: number;
    end_ms: number;
    text: string;
  }>;
}

export async function saveTranscript(input: SaveTranscriptInput): Promise<TranscriptRecord> {
  const supabase = await createSupabaseServerClient();
  
  const { data: transcript, error: transcriptError } = await supabase
    .from('transcripts')
    .upsert(
      {
        meeting_id: input.meeting_id,
        provider: input.provider,
        language: input.language,
        status: input.status ?? 'pending',
      },
      { onConflict: 'meeting_id' },
    )
    .select()
    .single();

  if (transcriptError) throw new Error(`Failed to save transcript: ${transcriptError.message}`);

  const { error: clearSegmentsError } = await supabase
    .from('transcript_segments')
    .delete()
    .eq('transcript_id', transcript.id);

  if (clearSegmentsError) throw new Error(`Failed to reset transcript segments: ${clearSegmentsError.message}`);

  if (input.segments && input.segments.length > 0) {
    const { error: segmentsError } = await supabase
      .from('transcript_segments')
      .insert(
        input.segments.map((seg) => ({
          transcript_id: transcript.id,
          speaker_label: seg.speaker_label,
          start_ms: seg.start_ms,
          end_ms: seg.end_ms,
          text: seg.text,
        }))
      );

    if (segmentsError) throw new Error(`Failed to save transcript segments: ${segmentsError.message}`);
  }

  return transcript;
}

export async function getTranscript(meetingId: string): Promise<(TranscriptRecord & { segments: TranscriptSegmentRecord[] }) | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select(`
        *,
        segments:transcript_segments(*)
      `)
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('Not Found')) return null;
      console.warn('[Supabase Warning] getTranscript failed:', error.message);
      return null;
    }

    return {
      ...transcript,
      segments: transcript.segments ?? [],
    };
  } catch (err) {
    console.warn('[Supabase Exception] getTranscript failed:', err);
    return null;
  }
}