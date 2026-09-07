'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Play,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  ChevronDown,
  Sun,
  Trash2,
  MessageSquare,
  ListFilter,
  Check,
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
  const [activeTab, setActiveTab] = useState<'transcript' | 'key_points' | 'participants'>('transcript');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayCount, setDisplayCount] = useState(15);

  const meeting = summary.meetings;
  const meetingTitle = meeting?.title || 'Product Team Meeting';
  const meetingDate = meeting?.starts_at ? format(new Date(meeting.starts_at), 'EEE, d MMM yyyy') : 'Tue, 27 Aug 2024';
  const meetingTime = meeting?.starts_at ? format(new Date(meeting.starts_at), 'h:mm a') : '10:00 AM – 11:00 AM';

  const participantNames = Array.from(
    new Set(
      transcript?.map((s) => s.speaker_label).filter(Boolean) as string[] || ['Atharva', 'Saylee', 'Savita']
    )
  );

  const getSpeakerAvatarColor = (name: string, index: number) => {
    const colors = [
      'bg-blue-600/30 text-blue-400 border-blue-500/30',
      'bg-purple-600/30 text-purple-400 border-purple-500/30',
      'bg-emerald-600/30 text-emerald-400 border-emerald-500/30',
      'bg-amber-600/30 text-amber-400 border-amber-500/30',
    ];
    return colors[index % colors.length];
  };

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
      window.location.href = '/summaries';
    } catch {
      setIsDeleting(false);
    }
  };

  const filteredTranscript = transcript?.filter((seg) =>
    transcriptSearch
      ? seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        seg.speaker_label?.toLowerCase().includes(transcriptSearch.toLowerCase())
      : true
  ) || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Breadcrumb & Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 text-sm text-sky-2/70">
          <Link
            href="/summaries"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Summaries</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white font-medium truncate max-w-[300px]">
            {meetingTitle}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-dark-3/60 text-sky-2/70 hover:text-white hover:bg-dark-3 transition-all">
            <Sun size={18} />
          </button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-dark-3/60 text-sky-2/70 hover:bg-red-500/20 hover:text-red-400"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* 2. Meeting Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {meetingTitle}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-sky-2/60">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-sky-1" />
              {meetingDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-sky-1" />
              {meetingTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-sky-1" />
              {participantNames.length > 0 ? participantNames.length : 3} participants
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (transcript && transcript.length > 0) {
                const el = document.getElementById('transcript-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="rounded-xl bg-blue-1 px-5 py-2.5 font-semibold text-white shadow-glow-blue transition-all hover:bg-blue-1/90"
          >
            <Play size={16} fill="currentColor" />
            &nbsp; Play Recording
          </Button>

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
            meetingTitle={meetingTitle}
            meetingDate={meeting?.starts_at ? new Date(meeting.starts_at) : new Date()}
          />
        </div>
      </div>

      {/* 3. Four Horizontal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
        {/* Overview Card */}
        <div className="flex flex-col justify-between rounded-2xl bg-dark-1/80 border border-white/10 p-5 backdrop-blur-xl shadow-card transition-all hover:border-white/20">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText size={18} />
              </div>
              <h3 className="font-semibold text-white">Overview</h3>
            </div>
            <p className="text-xs text-sky-2/80 leading-relaxed line-clamp-6">
              {summary.overview ||
                'The meeting focused on finalizing the MVP features, discussing the project timeline, and assigning responsibilities for the next development phase.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <TTSPlayer text={summary.overview} title="Audio Brief" className="p-2 border-0 bg-transparent" />
          </div>
        </div>

        {/* Action Items Card */}
        <div className="flex flex-col justify-between rounded-2xl bg-dark-1/80 border border-white/10 p-5 backdrop-blur-xl shadow-card transition-all hover:border-white/20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="font-semibold text-white">Action Items</h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 border border-emerald-500/30">
                {actionItems.length}
              </span>
            </div>
            {actionItems.length === 0 ? (
              <p className="text-xs text-sky-2/50 italic">No action items recorded.</p>
            ) : (
              <ul className="space-y-2 text-xs text-sky-2/80 max-h-[160px] overflow-y-auto pr-1">
                {actionItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <button
                      onClick={() => handleToggleActionItem(item.id, item.status)}
                      className="mt-0.5 shrink-0 text-emerald-400 hover:opacity-80"
                    >
                      {item.status === 'done' ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <div className="size-3.5 rounded-full border border-emerald-400/60 hover:bg-emerald-400/20" />
                      )}
                    </button>
                    <span className={cn(item.status === 'done' && 'line-through text-sky-2/40')}>
                      {item.task}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Decisions Card */}
        <div className="flex flex-col justify-between rounded-2xl bg-dark-1/80 border border-white/10 p-5 backdrop-blur-xl shadow-card transition-all hover:border-white/20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <AlertCircle size={18} />
                </div>
                <h3 className="font-semibold text-white">Decisions</h3>
              </div>
              <span className="rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold px-2.5 py-0.5 border border-purple-500/30">
                {summary.decisions.length}
              </span>
            </div>
            {summary.decisions.length === 0 ? (
              <p className="text-xs text-sky-2/50 italic">No explicit decisions recorded.</p>
            ) : (
              <ul className="space-y-2 text-xs text-sky-2/80 max-h-[160px] overflow-y-auto pr-1">
                {summary.decisions.map((d) => (
                  <li key={d.id} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>{d.decision}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Open Questions Card */}
        <div className="flex flex-col justify-between rounded-2xl bg-dark-1/80 border border-white/10 p-5 backdrop-blur-xl shadow-card transition-all hover:border-white/20">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <HelpCircle size={18} />
                </div>
                <h3 className="font-semibold text-white">Open Questions</h3>
              </div>
              <span className="rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold px-2.5 py-0.5 border border-amber-500/30">
                {summary.open_questions.length}
              </span>
            </div>
            {summary.open_questions.length === 0 ? (
              <p className="text-xs text-sky-2/50 italic">No unresolved questions.</p>
            ) : (
              <ul className="space-y-2 text-xs text-sky-2/80 max-h-[160px] overflow-y-auto pr-1">
                {summary.open_questions.map((q) => (
                  <li key={q.id} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{q.question}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 4. Full Width Tabbed Transcript & Discussion Section */}
      <div id="transcript-section" className="rounded-2xl bg-dark-1/80 border border-white/10 p-6 backdrop-blur-xl shadow-card space-y-6">
        {/* Tab Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('transcript')}
              className={cn(
                'flex items-center gap-2 font-medium text-sm pb-1 transition-all relative',
                activeTab === 'transcript'
                  ? 'text-white font-semibold'
                  : 'text-sky-2/60 hover:text-white'
              )}
            >
              <FileText size={16} />
              <span>Transcript</span>
              {activeTab === 'transcript' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-blue-1 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('key_points')}
              className={cn(
                'flex items-center gap-2 font-medium text-sm pb-1 transition-all relative',
                activeTab === 'key_points'
                  ? 'text-white font-semibold'
                  : 'text-sky-2/60 hover:text-white'
              )}
            >
              <ListFilter size={16} />
              <span>Key Discussion Points</span>
              {activeTab === 'key_points' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-blue-1 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={cn(
                'flex items-center gap-2 font-medium text-sm pb-1 transition-all relative',
                activeTab === 'participants'
                  ? 'text-white font-semibold'
                  : 'text-sky-2/60 hover:text-white'
              )}
            >
              <Users size={16} />
              <span>Participants ({participantNames.length})</span>
              {activeTab === 'participants' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-blue-1 rounded-full" />
              )}
            </button>
          </div>

          {activeTab === 'transcript' && (
            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-2/40" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                className="w-full rounded-xl bg-dark-2/90 border border-white/10 pl-9 pr-4 py-2 text-xs text-white placeholder:text-sky-2/40 focus:outline-none focus:border-blue-1"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === 'transcript' && (
          <div className="space-y-3">
            {filteredTranscript.length === 0 ? (
              <div className="text-center py-12 text-sky-2/50 text-sm">
                No transcript entries match your search.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTranscript.slice(0, displayCount).map((seg, idx) => {
                  const speaker = seg.speaker_label || 'Participant';
                  const pIdx = participantNames.indexOf(speaker);
                  const colorClass = getSpeakerAvatarColor(speaker, pIdx >= 0 ? pIdx : idx);
                  const min = Math.floor(seg.start_ms / 60000);
                  const sec = String(Math.floor((seg.start_ms % 60000) / 1000)).padStart(2, '0');
                  const timestampStr = `${min.toString().padStart(2, '0')}:${sec}`;

                  return (
                    <div
                      key={seg.id}
                      className={cn(
                        'flex items-start gap-4 p-3.5 rounded-xl border border-white/5 transition-all',
                        idx % 2 === 0 ? 'bg-dark-2/40' : 'bg-dark-2/80'
                      )}
                    >
                      <span className="text-xs font-mono text-sky-2/40 pt-1 w-12 shrink-0">
                        {timestampStr}
                      </span>
                      <div className={cn('size-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0', colorClass)}>
                        {speaker.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-xs font-semibold text-white">
                          {speaker}
                        </div>
                        <p className="text-xs text-sky-2/90 leading-relaxed">
                          {seg.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredTranscript.length > displayCount && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 20)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-sky-2 hover:text-white bg-dark-3/60 px-4 py-2 rounded-xl border border-white/10 hover:bg-dark-3 transition-colors"
                >
                  <span>Load more transcript</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'key_points' && (
          <div className="space-y-4 py-2">
            <h4 className="text-sm font-semibold text-white">Core Discussion Highlights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-sky-2/90">
              <div className="p-4 rounded-xl bg-dark-2/60 border border-white/5 space-y-2">
                <h5 className="font-medium text-blue-400">1. Architecture & MVP Scope</h5>
                <p>Detailed discussion on finalizing core user-facing features and API contracts.</p>
              </div>
              <div className="p-4 rounded-xl bg-dark-2/60 border border-white/5 space-y-2">
                <h5 className="font-medium text-purple-400">2. Timeline & Delivery Milestones</h5>
                <p>Establishes sprint boundaries and code freeze dates prior to testing phase.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
            {participantNames.map((name, i) => (
              <div key={name} className="flex items-center gap-3 p-3.5 rounded-xl bg-dark-2/60 border border-white/5">
                <div className={cn('size-9 rounded-full border flex items-center justify-center text-xs font-bold', getSpeakerAvatarColor(name, i))}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{name}</div>
                  <div className="text-[11px] text-sky-2/50">Speaker</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
