import { MeetingSummaryResult } from '@/lib/ai/provider';

export function exportSummaryAsJSON(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date,
): string {
  return JSON.stringify(
    {
      metadata: {
        title: meetingTitle,
        date: meetingDate.toISOString(),
        model: summary.model,
        exportedAt: new Date().toISOString(),
      },
      summary: {
        overview: summary.overview,
        provenance: summary.provenance,
        actionItems: summary.action_items.map((item) => ({
          task: item.task,
          assignee: item.assignee ?? null,
          context: item.context ?? null,
          status: item.status ?? 'open',
        })),
        decisions: summary.decisions.map((d) => ({
          decision: d.decision,
          context: d.context ?? null,
        })),
        openQuestions: summary.open_questions.map((q) => ({
          question: q.question,
          context: q.context ?? null,
        })),
      },
    },
    null,
    2,
  );
}
