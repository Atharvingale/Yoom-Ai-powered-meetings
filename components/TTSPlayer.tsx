'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  createTTSProvider,
  TTSProvider,
  TTSProviderType,
} from '@/lib/tts';

interface TTSPlayerProps {
  text: string;
  title?: string;
  className?: string;
}

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
];

const VOICE_OPTIONS = [
  { label: 'Nova (OpenAI)', value: 'openai-nova' },
  { label: 'Alloy (OpenAI)', value: 'openai-alloy' },
  { label: 'Echo (OpenAI)', value: 'openai-echo' },
  { label: 'Fable (OpenAI)', value: 'openai-fable' },
  { label: 'Onyx (OpenAI)', value: 'openai-onyx' },
  { label: 'Shimmer (OpenAI)', value: 'openai-shimmer' },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getEstimatedDuration(text: string, rate: number): number {
  const wordsPerMinute = 150 * rate;
  const wordCount = text.split(/\s+/).length;
  return (wordCount / wordsPerMinute) * 60;
}

export default function TTSPlayer({
  text,
  title,
  className,
}: TTSPlayerProps) {
  const providerRef = useRef<TTSProvider | null>(null);
  const [providerType, setProviderType] = useState<TTSProviderType>('web');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('web-default');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const provider = createTTSProvider();
    providerRef.current = provider;

    if (provider.name === 'openai-tts') {
      setProviderType('openai');
    } else {
      setProviderType('web');
    }

    setEstimatedTotal(getEstimatedDuration(text, speed));

    return () => {
      provider.stop();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    setEstimatedTotal(getEstimatedDuration(text, speed));
  }, [text, speed]);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (providerType === 'openai') {
      progressInterval.current = setInterval(() => {
        const openaiProvider = providerRef.current as ReturnType<typeof createTTSProvider> & {
          getProgress?: () => number;
          getCurrentTime?: () => number;
          getDuration?: () => number;
        };
        if (openaiProvider.getProgress) {
          const p = openaiProvider.getProgress();
          setProgress(p);
          setCurrentTime(openaiProvider.getCurrentTime?.() ?? 0);
        }
      }, 100);
    } else {
      const startTime = Date.now();

      progressInterval.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const p = estimatedTotal > 0 ? (elapsed / estimatedTotal) * 100 : 0;
        setProgress(Math.min(p, 100));
        setCurrentTime(elapsed);
      }, 100);
    }
  }, [providerType, estimatedTotal]);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!providerRef.current || !text.trim()) return;

    if (isPlaying) {
      providerRef.current.pause();
      setIsPlaying(false);
      stopProgressTracking();
      return;
    }

    setIsLoading(true);
    try {
      providerRef.current.setRate(speed);

      if (providerType === 'openai' && selectedVoice.startsWith('openai-')) {
        providerRef.current.setVoice(selectedVoice.replace('openai-', ''));
      }

      const playPromise = providerRef.current.speak(text, {
        rate: speed,
        onStart: () => {
          setIsLoading(false);
          setIsPlaying(true);
          startProgressTracking();
        },
        onEnd: () => {
          setIsPlaying(false);
          setProgress(100);
          stopProgressTracking();
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsPlaying(false);
          setIsLoading(false);
          stopProgressTracking();
        },
      });

      await playPromise;
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setIsLoading(false);
      stopProgressTracking();
    }
  }, [text, isPlaying, speed, providerType, selectedVoice, startProgressTracking, stopProgressTracking]);

  const handleStop = useCallback(() => {
    providerRef.current?.stop();
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    setCurrentTime(0);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      providerRef.current?.setRate(newSpeed);
      setShowSpeedMenu(false);
    },
    [],
  );

  const handleVoiceChange = useCallback(
    (voice: string) => {
      setSelectedVoice(voice);
      if (voice.startsWith('openai-')) {
        const newType: TTSProviderType = 'openai';
        if (providerRef.current?.name !== 'openai-tts') {
          providerRef.current?.stop();
          providerRef.current = createTTSProvider(newType);
          setProviderType(newType);
        }
        providerRef.current?.setVoice(voice.replace('openai-', ''));
      }
      setShowVoiceMenu(false);
    },
    [],
  );

  const remainingTime = Math.max(0, estimatedTotal - currentTime);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[14px] bg-dark-1 p-5 border border-dark-3',
        className,
      )}
    >
      {title && (
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-blue-1" />
          <h3 className="font-semibold text-sky-1">{title}</h3>
        </div>
      )}

      {/* Waveform visualization */}
      <div className="flex h-12 items-end justify-center gap-1">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full transition-all duration-150',
              isPlaying ? 'bg-blue-1 animate-wave' : 'bg-dark-3',
            )}
            style={{
              height: isPlaying ? undefined : '4px',
              animationDelay: `${i * 0.05}s`,
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          />
        ))}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs text-sky-2">
          <span>{formatTime(currentTime)}</span>
          <span>
            {formatTime(remainingTime)} remaining
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleStop}
          disabled={!isPlaying && !isLoading}
          className="flex size-9 items-center justify-center rounded-full bg-dark-3 text-white transition-colors hover:bg-dark-2 disabled:opacity-40"
        >
          <Square size={16} fill="currentColor" />
        </button>

        <button
          onClick={handlePlay}
          disabled={isLoading || !text.trim()}
          className="flex size-12 items-center justify-center rounded-full bg-blue-1 text-white transition-colors hover:bg-blue-1/80 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={22} fill="currentColor" />
          ) : (
            <Play size={22} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Speed selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSpeedMenu((prev) => !prev);
              setShowVoiceMenu(false);
            }}
            className="flex h-9 items-center gap-1 rounded-full bg-dark-3 px-3 text-xs font-medium text-white transition-colors hover:bg-dark-2"
          >
            {speed}x
            <ChevronDown size={12} />
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg border border-dark-3 bg-dark-2 p-1 shadow-lg">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={cn(
                    'block w-full rounded-md px-3 py-1.5 text-xs text-left transition-colors',
                    speed === option.value
                      ? 'bg-blue-1 text-white'
                      : 'text-sky-2 hover:bg-dark-3 hover:text-white',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowVoiceMenu((prev) => !prev);
              setShowSpeedMenu(false);
            }}
            className="flex h-9 items-center gap-1 rounded-full bg-dark-3 px-3 text-xs font-medium text-white transition-colors hover:bg-dark-2"
          >
            <Volume2 size={12} />
            <ChevronDown size={12} />
          </button>
          {showVoiceMenu && (
            <div className="absolute bottom-full right-0 z-50 mb-2 rounded-lg border border-dark-3 bg-dark-2 p-1 shadow-lg">
              {VOICE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVoiceChange(option.value)}
                  className={cn(
                    'block w-full rounded-md px-3 py-1.5 text-xs text-left whitespace-nowrap transition-colors',
                    selectedVoice === option.value
                      ? 'bg-blue-1 text-white'
                      : 'text-sky-2 hover:bg-dark-3 hover:text-white',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
