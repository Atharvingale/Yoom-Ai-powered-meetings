'use client';

import { Calendar, CheckCircle2, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
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
    ? format(new Date(meeting.starts_at), 'EEE, d MMM yyyy')
    : 'Recent';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex min-h-[210px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl bg-dark-1/90 p-6 border border-dark-3/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-2xl'
      )}
    >
      {/* Top Accent Gradient line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-60 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-sky-200/70">
            <Calendar size={13} className="text-purple-400" />
            <span>{meetingDate}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-800/40">
            <Sparkles size={11} className="text-purple-400" />
            AI Summary
          </span>
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1 group-hover:text-purple-200 transition-colors pt-1">
          {meeting?.title || 'Untitled Meeting'}
        </h3>

        <p className="text-xs text-sky-200/70 line-clamp-2 leading-relaxed pt-1">
          {summary.overview || meeting?.description || 'AI-generated summary and transcript takeaways.'}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-dark-3/40">
        <div className="flex items-center gap-2">
          {summary.action_items_count > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-800/40">
              <CheckCircle2 size={12} className="text-emerald-400" />
              {summary.action_items_count} Action{summary.action_items_count > 1 ? 's' : ''}
            </span>
          )}
          {summary.decisions_count > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950/60 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-800/40">
              <AlertCircle size={12} className="text-purple-400" />
              {summary.decisions_count} Decision{summary.decisions_count > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div
          className="flex size-8 items-center justify-center rounded-xl bg-dark-3/60 text-sky-200/60 transition-all group-hover:bg-purple-600 group-hover:text-white"
          title="View Summary"
        >
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}
