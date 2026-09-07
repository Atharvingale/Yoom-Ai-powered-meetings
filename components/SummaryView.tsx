'use client';

import { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Brain,
  User,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import TTSPlayer from './TTSPlayer';
import { TranscriptSegmentRecord } from '@/lib/supabase/transcripts';
import { FullMeetingSummary } from '@/lib/supabase/summaries';
import { updateActionItemStatus, deleteSummary } from '@/actions/summary.actions';
import { ExportMenu } from './ExportMenu';

interface SummaryViewProps {
  meetingId: string;
  summary: FullMeetingSummary;
  transcript?: TranscriptSegmentRecord[];
}

export function SummaryView({ meetingId, summary, transcript }: SummaryViewProps) {
  const [actionItems, setActionItems] = useState(summary.action_items);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const meeting = summary.meetings;
  const meetingDate = meeting?.starts_at ? format(new Date(meeting.starts_at), 'MMMM d, yyyy') : '';
  const meetingTime = meeting?.starts_at ? format(new Date(meeting.starts_at), 'h:mm a') : '';

  let duration = '';
  if (meeting?.starts_at && meeting?.ended_at) {
    const diff = new Date(meeting.ended_at).getTime() - new Date(meeting.starts_at).getTime();
    const mins = Math.floor(diff / 60000);
    duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }

  const handleToggleActionItem = async (itemId: string, currentStatus: 'open' | 'done') => {
    const newStatus = currentStatus === 'open' ? 'done' : 'open';
    setActionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );
    try {
      await updateActionItemStatus(itemId, newStatus);
    } catch {
      setActionItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: currentStatus } : item))
      );
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this summary?')) return;
    setIsDeleting(true);
    try {
      await deleteSummary(summary.id);
      window.location.href = '/';
    } catch {
      setIsDeleting(false);
    }
  };

  const filteredTranscript = transcript?.filter((seg) =>
    transcriptSearch
      ? seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        seg.speaker_label?.toLowerCase().includes(transcriptSearch.toLowerCase())
      : true
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {meeting?.title || 'Meeting Summary'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-sky-2">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {meetingDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {meetingTime}
              {duration && ` (${duration})`}
            </span>
            <span className="flex items-center gap-1.5">
              <Brain size={14} />
              {summary.model}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            summary={{
              overview: summary.overview,
              provenance: 'mixed',
              action_items: summary.action_items.map(({ task, assignee, context, status }) => ({
                task,
                assignee: assignee || undefined,
                context: context || undefined,
                status,
              })),
              decisions: summary.decisions.map(({ decision, context }) => ({
                decision,
                context: context || undefined,
              })),
              open_questions: summary.open_questions.map(({ question, context }) => ({
                question,
                context: context || undefined,
              })),
              model: summary.model,
            }}
            meetingTitle={meeting?.title || 'Meeting Summary'}
            meetingDate={meeting?.starts_at ? new Date(meeting.starts_at) : new Date()}
          />
          <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-dark-3 text-sky-2 hover:bg-red-500/20 hover:text-red-400"
        >
          <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Overview + TTS */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-sky-1">Overview</h2>
        <div className="rounded-[14px] bg-dark-1 p-6 border border-dark-3">
          <p className="whitespace-pre-wrap text-sky-2 leading-relaxed">
            {summary.overview}
          </p>
        </div>
        <div className="mt-4">
          <TTSPlayer text={summary.overview} title="Listen to summary" />
        </div>
      </section>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-sky-1 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-blue-1" />
            Action Items
            <span className="ml-1 rounded-full bg-dark-3 px-2 py-0.5 text-xs text-sky-2">
              {actionItems.filter((i) => i.status === 'done').length}/{actionItems.length}
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-start gap-3 rounded-[14px] border p-4 transition-colors',
                  item.status === 'done'
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-dark-3 bg-dark-1'
                )}
              >
                <button
                  onClick={() => handleToggleActionItem(item.id, item.status)}
                  className="mt-0.5 shrink-0"
                >
                  {item.status === 'done' ? (
                    <CheckCircle2 size={20} className="text-green-400" />
                  ) : (
                    <Circle size={20} className="text-sky-2 hover:text-blue-1" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sky-1',
                      item.status === 'done' && 'line-through opacity-60'
                    )}
                  >
                    {item.task}
                  </p>
                  {item.assignee && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-sky-2">
                      <User size={12} />
                      {item.assignee}
                    </span>
                  )}
                  {item.context && (
                    <p className="mt-1 text-xs italic text-sky-2/60">{item.context}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Decisions */}
      {summary.decisions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-sky-1 flex items-center gap-2">
            <AlertCircle size={20} className="text-purple-1" />
            Decisions
          </h2>
          <div className="flex flex-col gap-3">
            {summary.decisions.map((decision) => (
              <div
                key={decision.id}
                className="rounded-[14px] border border-purple-1/30 bg-purple-1/10 p-4"
              >
                <p className="text-sky-1">{decision.decision}</p>
                {decision.context && (
                  <blockquote className="mt-2 border-l-2 border-purple-1/40 pl-3 text-sm italic text-sky-2/70">
                    &ldquo;{decision.context}&rdquo;
                  </blockquote>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open Questions */}
      {summary.open_questions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-sky-1 flex items-center gap-2">
            <HelpCircle size={20} className="text-yellow-1" />
            Open Questions
          </h2>
          <div className="flex flex-col gap-3">
            {summary.open_questions.map((q) => (
              <div
                key={q.id}
                className="rounded-[14px] border border-yellow-1/30 bg-yellow-1/10 p-4"
              >
                <p className="text-sky-1">{q.question}</p>
                {q.context && (
                  <p className="mt-1 text-xs italic text-sky-2/60">{q.context}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript */}
      {transcript && transcript.length > 0 && (
        <section className="mb-8">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="mb-4 flex items-center gap-2 text-xl font-semibold text-sky-1 hover:text-white transition-colors"
          >
            <FileText size={20} className="text-blue-1" />
            Transcript
            <span className="rounded-full bg-dark-3 px-2 py-0.5 text-xs text-sky-2">
              {transcript.length} segments
            </span>
            {showTranscript ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {showTranscript && (
            <div className="rounded-[14px] border border-dark-3 bg-dark-1 p-4">
              <input
                type="text"
                placeholder="Search transcript..."
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                className="mb-4 w-full rounded-lg bg-dark-2 border border-dark-3 px-4 py-2 text-sm text-white placeholder:text-sky-2/50 focus:outline-none focus:border-blue-1"
              />
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredTranscript?.map((seg) => (
                  <div key={seg.id} className="rounded bg-dark-2 p-3 text-sm border border-dark-3">
                    <span className="font-bold text-sky-1">{seg.speaker_label || 'Speaker'}</span>
                    <span className="ml-2 text-xs text-sky-2/40">
                      {Math.floor(seg.start_ms / 60000)}:{String(Math.floor((seg.start_ms % 60000) / 1000)).padStart(2, '0')}
                    </span>
                    <p className="mt-1 text-sky-2">{seg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
