import { createSupabaseServerClient } from './server';

export interface MeetingRecord {
  id: string;
  clerk_user_id: string;
  title: string | null;
  description: string | null;
  starts_at: string;
  ended_at: string | null;
  stream_call_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingInput {
  clerk_user_id: string;
  title?: string;
  description?: string;
  starts_at: string;
  stream_call_id?: string;
}

export async function createMeeting(input: CreateMeetingInput): Promise<MeetingRecord> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      clerk_user_id: input.clerk_user_id,
      title: input.title,
      description: input.description,
      starts_at: input.starts_at,
      stream_call_id: input.stream_call_id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create meeting: ${error.message}`);
  return data;
}

export async function getOrCreateMeetingByStreamCallId(
  streamCallId: string,
  clerkUserId: string,
  metadata: Pick<CreateMeetingInput, 'title' | 'description' | 'starts_at'>,
): Promise<MeetingRecord | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing, error: lookupError } = await supabase
      .from('meetings')
      .select('*')
      .eq('stream_call_id', streamCallId)
      .maybeSingle();

    if (!lookupError && existing) return existing;

    const { data, error: insertError } = await supabase
      .from('meetings')
      .insert({
        clerk_user_id: clerkUserId,
        title: metadata.title,
        description: metadata.description,
        starts_at: metadata.starts_at,
        stream_call_id: streamCallId,
      })
      .select()
      .single();

    if (insertError) {
      if (!insertError.message?.includes('Could not find the table')) {
        console.warn('[Supabase Warning] Failed to insert meeting:', insertError.message);
      }
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[Supabase Exception] Failed in getOrCreateMeetingByStreamCallId:', err);
    return null;
  }
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST204' ||
        error.message?.includes('Not Found') ||
        error.message?.includes('Could not find the table')
      ) {
        return null;
      }
      console.warn('[Supabase Warning] getMeeting failed:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase Exception] getMeeting failed:', err);
    return null;
  }
}

export async function getMeetingByStreamCallId(streamCallId: string): Promise<MeetingRecord | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('stream_call_id', streamCallId)
      .maybeSingle();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.code === 'PGRST204' ||
        error.message?.includes('Not Found') ||
        error.message?.includes('Could not find the table')
      ) {
        return null;
      }
      console.warn('[Supabase Warning] getMeetingByStreamCallId failed:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase Exception] getMeetingByStreamCallId failed:', err);
    return null;
  }
}

export async function markMeetingEnded(meetingId: string): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('meetings')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', meetingId);

    if (error) {
      console.warn('[Supabase Warning] markMeetingEnded failed:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Exception] markMeetingEnded failed:', err);
  }
}

export async function listMeetingsByUser(clerkUserId: string, limit = 50, offset = 0): Promise<MeetingRecord[]> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('starts_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to list meetings: ${error.message}`);
  return data ?? [];
}