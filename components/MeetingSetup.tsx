'use client';
import { useEffect, useState } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
  const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const call = useCall();

  if (!call) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
  const [isMicCamToggled, setIsMicCamToggled] = useState(false);

  useEffect(() => {
    if (isMicCamToggled) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [isMicCamToggled, call.camera, call.microphone]);

  if (callTimeNotArrived)
    return (
      <Alert
        title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
      />
    );

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 text-white">
      <div className="w-full max-w-2xl rounded-3xl glassmorphism-v2 p-8 flex flex-col items-center gap-6 animate-slide-up">
        <h1 className="text-center text-2xl font-bold">Setup</h1>
        <div className="w-full rounded-2xl overflow-hidden bg-dark-2">
          <VideoPreview />
        </div>
        <div className="flex items-center justify-center gap-4">
          <label className="flex items-center justify-center gap-3 font-medium text-text-secondary">
            <button
              onClick={() => setIsMicCamToggled(!isMicCamToggled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                isMicCamToggled ? 'bg-accent-blue' : 'bg-dark-3'
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white transition-transform duration-300 ${
                  isMicCamToggled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            Join with mic and camera off
          </label>
          <DeviceSettings />
        </div>
        <Button
          className="rounded-xl bg-accent-green px-8 py-3 text-base font-semibold shadow-glow-blue transition-all duration-300 hover:shadow-glow-blue hover:scale-105"
          onClick={() => {
            call.join();

            setIsSetupComplete(true);
          }}
        >
          Join meeting
        </Button>
      </div>
    </div>
  );
};

export default MeetingSetup;
