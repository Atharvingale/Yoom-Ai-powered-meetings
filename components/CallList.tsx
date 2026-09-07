'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { startPostMeetingPipeline } from '@/actions/agents.actions';
import { AgentStatus } from './AgentStatus';
import { Search, LayoutGrid, List, Inbox } from 'lucide-react';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

type RecordingWithCall = CallRecording & { streamCallId: string };

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<RecordingWithCall[]>([]);
  const [meetingSummaryIds, setMeetingSummaryIds] = useState<Set<string>>(new Set());
  const [processingCallId, setProcessingCallId] = useState<string | null>(null);
  const [processingMeetingId, setProcessingMeetingId] = useState<string | null>(null);
  
  // Search & Layout state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        return 'No Previous Calls Found';
      case 'upcoming':
        return 'No Upcoming Calls Scheduled';
      case 'recordings':
        return 'No Meeting Recordings Available';
      default:
        return 'No Calls Found';
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

  const rawCalls = getCalls();

  // Filter calls by search query
  const filteredCalls = (rawCalls || []).filter((meeting: Call | CallRecording) => {
    if (!searchQuery.trim()) return true;
    const title =
      (meeting as Call).state?.custom?.description ||
      (meeting as CallRecording).filename ||
      '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex min-h-[250px] w-full flex-col justify-between rounded-2xl border border-dark-3/40 bg-dark-1/60 p-6 animate-pulse"
          >
            <div className="flex flex-col gap-4">
              <div className="size-11 rounded-xl bg-dark-3/60" />
              <div className="h-6 w-3/4 rounded-md bg-dark-3/60" />
              <div className="h-4 w-1/2 rounded-md bg-dark-3/40" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-dark-3/30">
              <div className="h-10 w-28 rounded-xl bg-dark-3/60" />
              <div className="h-10 w-32 rounded-xl bg-dark-3/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-sky-200/60" />
          <Input
            placeholder={`Search ${type}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-11 bg-dark-1/80 border-dark-3/60 text-white placeholder:text-sky-200/50 rounded-xl focus-visible:ring-blue-1 focus-visible:border-blue-1 transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-200/70 bg-dark-1/90 px-3 py-1.5 rounded-lg border border-dark-3/40">
            Total: {filteredCalls.length}
          </span>

          <div className="flex items-center gap-1 bg-dark-1/90 p-1 rounded-xl border border-dark-3/40">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid'
                  ? "bg-blue-1 text-white shadow-sm"
                  : "text-sky-200/60 hover:text-white"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'list'
                  ? "bg-blue-1 text-white shadow-sm"
                  : "text-sky-200/60 hover:text-white"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List View */}
      {filteredCalls.length > 0 ? (
        <div
          className={cn(
            "grid gap-5",
            viewMode === 'grid'
              ? "grid-cols-1 xl:grid-cols-2"
              : "grid-cols-1"
          )}
        >
          {filteredCalls.map((meeting: Call | CallRecording) => (
            <div
              key={
                (meeting as Call).id ||
                (meeting as RecordingWithCall).url ||
                (meeting as CallRecording).filename
              }
            >
              <MeetingCard
                icon={
                  type === 'ended'
                    ? '/icons/previous.svg'
                    : type === 'upcoming'
                      ? '/icons/upcoming.svg'
                      : '/icons/recordings.svg'
                }
                title={
                  (meeting as Call).state?.custom?.description ||
                  (meeting as CallRecording).filename?.substring(0, 30) ||
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
                aiAction={
                  type === 'recordings'
                    ? {
                        label:
                          processingCallId === (meeting as CallRecording).filename
                            ? 'Starting...'
                            : 'Generate AI Notes',
                        onClick: async () => {
                          const recording = meeting as RecordingWithCall;
                          const streamCallId = recording.streamCallId;
                          setProcessingCallId(recording.filename);
                          try {
                            const status = await startPostMeetingPipeline(
                              streamCallId,
                              recording.url,
                              {
                                title: recording.filename,
                                startsAt: recording.start_time,
                              }
                            );
                            setProcessingMeetingId(status.meetingId);
                          } catch (error) {
                            console.error(error);
                          } finally {
                            setProcessingCallId(null);
                          }
                        },
                      }
                    : undefined
                }
              />
              {processingMeetingId && type === 'recordings' && (
                <AgentStatus
                  meetingId={processingMeetingId}
                  onComplete={() => router.push(`/summary/${processingMeetingId}`)}
                  className="mt-3"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-dark-3/60 bg-dark-1/40 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-dark-3/60 text-sky-200/60">
            <Inbox size={28} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h2 className="text-xl font-bold text-white">
              {searchQuery ? 'No matching results' : getNoCallsMessage()}
            </h2>
            <p className="text-xs text-sky-200/60">
              {searchQuery
                ? `No items match "${searchQuery}". Try searching with a different term.`
                : type === 'recordings'
                  ? 'Recordings of your meetings will appear here automatically once calls finish recording.'
                  : 'Your scheduled or past calls list is currently empty.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallList;
