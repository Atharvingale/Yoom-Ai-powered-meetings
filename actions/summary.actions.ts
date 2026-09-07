'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMeetingByStreamCallId } from '@/lib/supabase/meetings';

export async function updateActionItemStatus(actionItemId: string, status: 'open' | 'done'): Promise<void> {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('action_items')
    .update({ status })
    .eq('id', actionItemId);

  if (error) throw new Error(`Failed to update action item: ${error.message}`);
}

export async function deleteSummary(summaryId: string): Promise<void> {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('meeting_summaries')
    .delete()
    .eq('id', summaryId);

  if (error) throw new Error(`Failed to delete summary: ${error.message}`);
}

export async function getTranscriptAction(meetingId: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await createSupabaseServerClient();
    const meeting = await getMeetingByStreamCallId(meetingId);
    const resolvedMeetingId = meeting?.id || meetingId;

    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select('id, meeting_id, provider, language, status, segments:transcript_segments(*)')
      .eq('meeting_id', resolvedMeetingId)
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
      console.warn('[Summary Action Warning] getTranscriptAction failed:', error.message);
      return null;
    }

    return transcript;
  } catch (err) {
    console.warn('[Summary Action Exception] getTranscriptAction failed:', err);
    return null;
  }
}

export async function getSummaryAction(meetingId: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await createSupabaseServerClient();
    const meeting = await getMeetingByStreamCallId(meetingId);
    const resolvedMeetingId = meeting?.id || meetingId;

    const { data: summary, error } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('meeting_id', resolvedMeetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('Not Found')) return null;
      console.warn('[Summary Action Warning] getSummaryAction failed:', error.message);
      return null;
    }

    return summary;
  } catch (err) {
    console.warn('[Summary Action Exception] getSummaryAction failed:', err);
    return null;
  }
}

export async function getMeetingAction(meetingId: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('Not Found')) return null;
      console.warn('[Summary Action Warning] getMeetingAction failed:', error.message);
      return null;
    }

    return meeting;
  } catch (err) {
    console.warn('[Summary Action Exception] getMeetingAction failed:', err);
    return null;
  }
}