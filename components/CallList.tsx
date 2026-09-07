'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { startPostMeetingPipeline } from '@/actions/agents.actions';
import { AgentStatus } from './AgentStatus';

type RecordingWithCall = CallRecording & { streamCallId: string };

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<RecordingWithCall[]>([]);
  const [meetingSummaryIds, setMeetingSummaryIds] = useState<Set<string>>(new Set());
  const [processingCallId, setProcessingCallId] = useState<string | null>(null);
  const [processingMeetingId, setProcessingMeetingId] = useState<string | null>(null);

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [],
      );

      const recordings = callData.flatMap((call, index) =>
        call.recordings.map((recording) => ({
          ...recording,
          streamCallId: callRecordings?.[index]?.id || '',
        })),
      );

      setRecordings(recordings);
    };

    if (type === 'recordings') {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  useEffect(() => {
    if (type !== 'ended' || !endedCalls || endedCalls.length === 0) return;

    const checkSummaries = async () => {
      const supabase = createSupabaseBrowserClient();
      const ids = endedCalls.map((c) => c.id);

      const { data } = await supabase
        .from('meeting_summaries')
        .select('meeting_id')
        .in('meeting_id', ids);

      if (data) {
        setMeetingSummaryIds(new Set(data.map((s) => s.meeting_id)));
      }
    };

    checkSummaries();
  }, [type, endedCalls]);

  if (isLoading) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls && calls.length > 0 ? (
        calls.map((meeting: Call | CallRecording) => (
          <div key={(meeting as Call).id || (meeting as RecordingWithCall).url || (meeting as CallRecording).filename}>
          <MeetingCard
            key={(meeting as Call).id || (meeting as RecordingWithCall).url || (meeting as CallRecording).filename}
            icon={
              type === 'ended'
                ? '/icons/previous.svg'
                : type === 'upcoming'
                  ? '/icons/upcoming.svg'
                  : '/icons/recordings.svg'
            }
            title={
              (meeting as Call).state?.custom?.description ||
              (meeting as CallRecording).filename?.substring(0, 20) ||
              'No Description'
            }
            date={
              (meeting as Call).state?.startsAt?.toLocaleString() ||
              (meeting as CallRecording).start_time?.toLocaleString()
            }
            isPreviousMeeting={type === 'ended'}
            summaryLink={
              type === 'ended' && meetingSummaryIds.has((meeting as Call).id)
                ? `/summary/${(meeting as Call).id}`
                : undefined
            }
            link={
              type === 'recordings'
                ? (meeting as CallRecording).url
                : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
            }
            buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
            buttonText={type === 'recordings' ? 'Play' : 'Start'}
            handleClick={
              type === 'recordings'
                ? () => router.push(`${(meeting as CallRecording).url}`)
                : () => router.push(`/meeting/${(meeting as Call).id}`)
            }
            aiAction={type === 'recordings' ? {
              label: processingCallId === (meeting as CallRecording).filename ? 'Starting...' : 'Generate AI Notes',
              onClick: async () => {
                const recording = meeting as RecordingWithCall;
                const streamCallId = recording.streamCallId;
                setProcessingCallId(recording.filename);
                try {
                  const status = await startPostMeetingPipeline(streamCallId, recording.url, {
                    title: recording.filename,
                    startsAt: recording.start_time,
                  });
                  setProcessingMeetingId(status.meetingId);
                } catch (error) {
                  console.error(error);
                } finally {
                  setProcessingCallId(null);
                }
              },
            } : undefined}
          />
          {processingMeetingId && type === 'recordings' && (
            <AgentStatus
              meetingId={processingMeetingId}
              onComplete={() => router.push(`/summary/${processingMeetingId}`)}
              className="mt-3"
            />
          )}
          </div>
        ))
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
