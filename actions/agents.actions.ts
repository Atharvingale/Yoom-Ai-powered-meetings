'use server';

import { currentUser } from '@clerk/nextjs/server';
import { runPostMeetingPipeline, PipelineStatus } from '@/lib/agents/pipeline';
import {
  getMeetingByStreamCallId,
  getOrCreateMeetingByStreamCallId,
} from '@/lib/supabase/meetings';

const pipelineStatuses = new Map<string, PipelineStatus>();

function statusKey(userId: string, meetingId: string): string {
  return `${userId}:${meetingId}`;
}

export async function startPostMeetingPipeline(
  streamCallId: string,
  recordingUrl: string,
  metadata?: { title?: string; startsAt?: string },
): Promise<PipelineStatus> {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  if (!recordingUrl) throw new Error('A recording URL is required');

  const existingMeeting = await getMeetingByStreamCallId(streamCallId);
  const meeting = existingMeeting || await getOrCreateMeetingByStreamCallId(
    streamCallId,
    user.id,
    {
      title: metadata?.title,
      description: metadata?.title,
      starts_at: metadata?.startsAt || new Date().toISOString(),
    },
  );
  const meetingId = meeting?.id || streamCallId;
  const key = statusKey(user.id, meetingId);
  const existing = pipelineStatuses.get(key);
  if (existing && existing.completedAt) return existing;

  const initialStatus: PipelineStatus = {
    meetingId,
    transcription: 'pending',
    summary: 'pending',
    tts: 'pending',
    startedAt: new Date(),
  };
  pipelineStatuses.set(key, initialStatus);

  void runPostMeetingPipeline(meetingId, recordingUrl, (update) => {
    pipelineStatuses.set(key, update);
  }).then((status) => {
    pipelineStatuses.set(key, status);
  });

  return initialStatus;
}

export async function getAgentStatus(meetingId: string): Promise<PipelineStatus | null> {
  try {
    const user = await currentUser();
    if (!user) return null;

    const userKey = statusKey(user.id, meetingId);
    const status = pipelineStatuses.get(userKey);
    if (status) return status;

    for (const [key, val] of Array.from(pipelineStatuses.entries())) {
      if (val.meetingId === meetingId && key.startsWith(user.id)) {
        return val;
      }
    }

    // Database fallback lookup if in-memory state is cleared
    const { getTranscript } = await import('@/lib/supabase/transcripts');
    const { getSummary } = await import('@/lib/supabase/summaries');

    const [transcript, summaryRes] = await Promise.all([
      getTranscript(meetingId),
      getSummary(meetingId),
    ]);

    if (summaryRes?.summary) {
      return {
        meetingId,
        transcription: 'success',
        summary: 'success',
        tts: 'success',
        startedAt: new Date(),
        completedAt: new Date(summaryRes.summary.generated_at),
      };
    }

    if (transcript && transcript.status === 'ready') {
      return {
        meetingId,
        transcription: 'success',
        summary: 'running',
        tts: 'pending',
        startedAt: new Date(),
      };
    }

    return null;
  } catch (err) {
    console.warn('[Agent Status Warning] getAgentStatus failed:', err);
    return null;
  }
}
