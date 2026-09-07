import { getSummaryByMeetingId } from '@/lib/supabase/summaries';
import { getTranscript } from '@/lib/supabase/transcripts';
import { SummaryView } from '@/components/SummaryView';

export default async function SummaryPage({
  params,
}: {
  params: { meetingId: string };
}) {
  const summary = await getSummaryByMeetingId(params.meetingId);
  const transcript = await getTranscript(params.meetingId);

  if (!summary) {
    return (
      <section className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Summary not found</h1>
          <p className="mt-2 text-sky-2">
            This meeting may not have a summary yet, or it is still being
            generated.
          </p>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-dark-2 pb-12">
      <SummaryView
        meetingId={params.meetingId}
        summary={summary}
        transcript={transcript?.segments}
      />
    </main>
  );
}
