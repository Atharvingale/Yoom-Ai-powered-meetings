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
        'group relative flex min-h-[190px] w-full cursor-pointer flex-col justify-between rounded-2xl bg-dark-1/80 px-6 py-6 border border-white/10 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-dark-1 hover:shadow-card'
      )}
    >
      <div>
        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
          {meeting?.title || 'Product Team Meeting'}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-sky-2/60">
          <Calendar size={13} className="text-sky-1" />
          <span>{meetingDate}</span>
        </div>
        {meeting?.description && (
          <p className="mt-3 text-xs text-sky-2/70 line-clamp-2 leading-relaxed">
            {meeting.description}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          {summary.action_items_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={12} />
              {summary.action_items_count} actions
            </span>
          )}
          {summary.decisions_count > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
              <AlertCircle size={12} />
              {summary.decisions_count} decisions
            </span>
          )}
        </div>

        <div
          className="flex size-8 items-center justify-center rounded-xl bg-dark-3/60 text-sky-2/70 transition-all group-hover:bg-blue-1 group-hover:text-white"
          title="View summary"
        >
          <Volume2 size={14} />
        </div>
      </div>
    </div>
  );
}
