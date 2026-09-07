import { listSummaries } from '@/lib/supabase/summaries';
import { SummaryCard } from '@/components/SummaryCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SummariesPage() {
  const summaries = await listSummaries();

  return (
    <section className="flex size-full flex-col gap-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold lg:text-3xl">Meeting Summaries</h1>
          <p className="mt-1 text-sm text-sky-2/60">
            AI-generated summaries, action items, decisions, and transcripts.
          </p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-dark-1/80 border border-white/10 p-8 text-center backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">No Summaries Yet</h2>
          <p className="mt-2 text-sm text-sky-2/60 max-w-md">
            Summaries are generated automatically when a meeting recording finishes processing. Check your recordings page to generate AI notes.
          </p>
          <Link
            href="/recordings"
            className="mt-6 rounded-xl bg-blue-1 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-blue transition-all hover:bg-blue-1/90"
          >
            View Recordings
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
