'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, FileText, X } from 'lucide-react';
import { getTranscriptAction } from '@/actions/summary.actions';
import { TranscriptSegmentRecord } from '@/lib/supabase/transcripts';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const call = useCall();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegmentRecord[]>([]);
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function loadTranscript() {
      if (!call?.id || !showTranscript) return;
      try {
        const trans = await getTranscriptAction(call.id);
        if (trans?.segments) {
          setTranscriptSegments(trans.segments);
        }
      } catch (err) {
        console.error('Failed to load in-meeting transcript:', err);
      }
    }

    if (showTranscript) {
      loadTranscript();
      intervalId = setInterval(loadTranscript, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [call?.id, showTranscript]);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn('h-[calc(100vh-86px)] hidden ml-2', {
            'show-block': showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>

        {/* In-Meeting Transcript Panel */}
        <div
          className={cn(
            'h-[calc(100vh-86px)] hidden ml-2 w-[320px] rounded-2xl glassmorphism-v2 p-4 flex-col gap-3 animate-slide-in-right',
            {
              flex: showTranscript,
            },
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-lg text-sky-1 flex items-center gap-2">
              <FileText size={18} /> Transcript
            </h3>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-text-tertiary hover:text-white transition-colors duration-200"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
            {transcriptSegments.length === 0 ? (
              <p className="text-sm text-text-tertiary italic text-center mt-6">
                No transcript available yet.
              </p>
            ) : (
              transcriptSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="rounded-xl bg-dark-2/80 p-2.5 text-xs border border-white/5"
                >
                  <div className="font-bold text-sky-1 mb-1">
                    {seg.speaker_label || 'Speaker'}
                  </div>
                  <div className="text-text-secondary">{seg.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* video layout and call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center pb-6">
        <div className="flex items-center gap-3 rounded-2xl glassmorphism-v2 px-6 py-3 shadow-card">
          <CallControls onLeave={() => router.push(`/`)} />

          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-xl bg-dark-3/80 px-4 py-2 hover:bg-dark-4 transition-colors duration-200">
                <LayoutList size={20} className="text-white" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="border-white/10 bg-dark-2 text-white">
              {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
                <div key={index}>
                  <DropdownMenuItem
                    onClick={() =>
                      setLayout(item.toLowerCase() as CallLayoutType)
                    }
                  >
                    {item}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-white/10" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <CallStatsButton />
          <button onClick={() => setShowParticipants((prev) => !prev)}>
            <div className="cursor-pointer rounded-xl bg-dark-3/80 px-4 py-2 hover:bg-dark-4 transition-colors duration-200">
              <Users size={20} className="text-white" />
            </div>
          </button>
          <button onClick={() => setShowTranscript((prev) => !prev)}>
            <div className="cursor-pointer rounded-xl bg-dark-3/80 px-4 py-2 hover:bg-dark-4 transition-colors duration-200">
              <FileText size={20} className="text-white" />
            </div>
          </button>
          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
