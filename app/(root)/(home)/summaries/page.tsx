import { listSummaries } from '@/lib/supabase/summaries';
import { SummaryCard } from '@/components/SummaryCard';
import Link from 'next/link';
import { Sparkles, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SummariesPage() {
  const summaries = await listSummaries();

  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex flex-col gap-2 border-b border-dark-3/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-950/50">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            AI Meeting Summaries
          </h1>
        </div>
        <p className="text-sm font-normal text-sky-200/70 max-w-2xl">
          Browse generated meeting insights, action item assignments, key decisions, and interactive transcripts.
        </p>
      </div>

      {summaries.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-dark-3/60 bg-dark-1/40 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-dark-3/60 text-sky-200/60 mb-3">
            <Inbox size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">No Summaries Yet</h2>
          <p className="mt-1 text-xs text-sky-200/60 max-w-md">
            Summaries are generated automatically when meeting recordings are processed with AI.
          </p>
          <Link
            href="/recordings"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-1 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-600 transition-all"
          >
            <span>View Recordings</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => (
            <Link key={summary.id} href={`/summary/${summary.meeting_id}`}>
              <SummaryCard summary={summary} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
