'use client';

import { Calendar, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SummaryWithMeeting } from '@/lib/supabase/summaries';

interface SummaryCardProps {
  summary: SummaryWithMeeting;
  onClick?: () => void;
}

export function SummaryCard({ summary, onClick }: SummaryCardProps) {
  const meeting = summary.meetings;
  const meetingDate = meeting?.starts_at
    ? format(new Date(meeting.starts_at), 'MMM d, yyyy')
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[180px] w-full cursor-pointer flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-6 border border-dark-3 transition-all hover:border-blue-1/40 hover:bg-dark-1/80'
      )}
    >
      <div>
        <h3 className="text-lg font-bold text-white line-clamp-1">
          {meeting?.title || 'Untitled Meeting'}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-sky-2">
          <Calendar size={13} />
          {meetingDate}
        </div>
        {meeting?.description && (
          <p className="mt-2 text-xs text-sky-2/60 line-clamp-2">
            {meeting.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {summary.action_items_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-blue-1/20 px-2.5 py-1 text-xs font-medium text-blue-1">
              <CheckCircle2 size={12} />
              {summary.action_items_count} actions
            </span>
          )}
          {summary.decisions_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-purple-1/20 px-2.5 py-1 text-xs font-medium text-purple-1">
              <AlertCircle size={12} />
              {summary.decisions_count} decisions
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="flex size-8 items-center justify-center rounded-full bg-dark-3 text-sky-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-1 hover:text-white"
          title="Listen to summary"
        >
          <Volume2 size={14} />
        </button>
      </div>
    </div>
  );
}
