'use client';

import Image from 'next/image';
import { FileText, Play, Copy, Calendar, Sparkles, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  summaryLink?: string;
  aiAction?: {
    label: string;
    onClick: () => void;
  };
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  summaryLink,
  aiAction,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isRecording = icon === '/icons/recordings.svg' || buttonText === 'Play';

  return (
    <section className="group relative flex min-h-[250px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-dark-3/60 bg-dark-1/90 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-blue-1/40 hover:shadow-2xl">
      {/* Top Accent Gradient line */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-1 transition-opacity duration-300 opacity-60 group-hover:opacity-100",
        isRecording ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500" : "bg-gradient-to-r from-blue-600 to-cyan-500"
      )} />

      <article className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
              isRecording ? "bg-purple-950/60 text-purple-400 border border-purple-800/40" : "bg-dark-3/80 text-blue-400"
            )}>
              <Image src={icon} alt="meeting-icon" width={22} height={22} className="brightness-125" />
            </div>
            {isRecording && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-900/40 px-3 py-1 text-xs font-medium text-purple-300 border border-purple-700/30">
                <span className="size-2 rounded-full bg-purple-400 animate-pulse" />
                Recording
              </span>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            title="Copy link"
            className="size-9 rounded-lg bg-dark-3/40 text-sky-200 transition-colors hover:bg-dark-3 hover:text-white"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </Button>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <h1 className="line-clamp-2 text-xl font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-sky-200/70">
            <Calendar size={14} className="text-sky-400/80" />
            <span>{date || 'Date unavailable'}</span>
          </div>
        </div>
      </article>

      <article className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-dark-3/40">
        {!isPreviousMeeting && (
          <Button
            onClick={handleClick}
            className={cn(
              "flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95",
              isRecording
                ? "bg-blue-1 hover:bg-blue-600 shadow-blue-900/20"
                : "bg-blue-1 hover:bg-blue-600 shadow-blue-900/20"
            )}
          >
            {buttonIcon1 ? (
              <Image src={buttonIcon1} alt="play" width={18} height={18} />
            ) : (
              <Play size={16} className="fill-white" />
            )}
            <span>{buttonText || 'Open'}</span>
          </Button>
        )}

        {aiAction && (
          <Button
            onClick={aiAction.onClick}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all"
          >
            <Sparkles size={16} className="animate-pulse text-purple-200" />
            <span>{aiAction.label}</span>
          </Button>
        )}

        {summaryLink && (
          <Button
            onClick={() => {
              window.location.href = summaryLink;
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-900/30 hover:bg-purple-500 active:scale-95 transition-all"
          >
            <FileText size={16} />
            <span>View Summary</span>
            <ExternalLink size={14} className="opacity-70" />
          </Button>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
