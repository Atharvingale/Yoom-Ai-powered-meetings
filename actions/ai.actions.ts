'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getTranscript } from '@/lib/supabase/transcripts';
import { getMeetingByStreamCallId } from '@/lib/supabase/meetings';
import { generateMeetingSummary } from '@/lib/ai';

export async function generateSummaryAction(meetingId: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized: User must be signed in to generate summaries');
  }

  const meeting = await getMeetingByStreamCallId(meetingId);
  const resolvedMeetingId = meeting?.id || meetingId;
  const transcript = await getTranscript(resolvedMeetingId);
  if (!transcript || transcript.segments.length === 0) {
    throw new Error(`No transcript available for meeting ${meetingId}`);
  }

  return await generateMeetingSummary(resolvedMeetingId, transcript.segments);
}
