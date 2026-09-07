'use server';

import { currentUser } from '@clerk/nextjs/server';
import { getMeeting, getMeetingByStreamCallId } from '@/lib/supabase/meetings';
import { processMeetingTranscription } from '@/lib/transcription';

export async function triggerTranscriptionAction(
  meetingId: string,
  recordingUrl: string
) {
  const user = await currentUser();
  if (!user) {
    throw new Error('Unauthorized: User must be signed in to trigger transcription');
  }

  const meeting = await getMeeting(meetingId) || await getMeetingByStreamCallId(meetingId);
  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }

  return await processMeetingTranscription(meeting.id, recordingUrl);
}
