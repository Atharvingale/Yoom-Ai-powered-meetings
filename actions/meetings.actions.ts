'use server';

import { currentUser } from '@clerk/nextjs/server';
import {
  getOrCreateMeetingByStreamCallId,
  markMeetingEnded,
} from '@/lib/supabase/meetings';

export async function ensureMeetingRecord(input: {
  streamCallId: string;
  title?: string;
  description?: string;
  startsAt: string;
}) {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    return await getOrCreateMeetingByStreamCallId(input.streamCallId, user.id, {
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
    });
  } catch (err) {
    console.warn('[Meeting Action Warning] ensureMeetingRecord failed:', err);
    return null;
  }
}

export async function markStreamMeetingEnded(streamCallId: string) {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id, clerk_user_id')
      .eq('stream_call_id', streamCallId)
      .maybeSingle();

    if (!meeting || meeting.clerk_user_id !== user.id) return;
    await markMeetingEnded(meeting.id);
  } catch (err) {
    console.warn('[Meeting Action Warning] markStreamMeetingEnded failed:', err);
  }
}
