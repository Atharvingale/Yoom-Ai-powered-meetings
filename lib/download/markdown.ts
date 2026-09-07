import { MeetingSummaryResult } from '@/lib/ai/provider';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function exportSummaryAsMarkdown(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date,
): string {
  const lines: string[] = [];

  lines.push(`# Meeting Summary: ${meetingTitle}`);
  lines.push('');
  lines.push(`**Date:** ${formatDate(meetingDate)}`);
  lines.push(`**Model:** ${summary.model}`);
  lines.push('');

  lines.push('## Overview');
  lines.push('');
  lines.push(summary.overview);
  lines.push('');

  if (summary.action_items.length > 0) {
    lines.push('## Action Items');
    lines.push('');
    for (const item of summary.action_items) {
      const checkbox = item.status === 'done' ? '[x]' : '[ ]';
      const assignee = item.assignee ? ` — ${item.assignee}` : '';
      lines.push(`- ${checkbox} ${item.task}${assignee}`);
      if (item.context) {
        lines.push(`  > ${item.context}`);
      }
    }
    lines.push('');
  }

  if (summary.decisions.length > 0) {
    lines.push('## Decisions');
    lines.push('');
    for (const d of summary.decisions) {
      lines.push(`- ${d.decision}`);
      if (d.context) {
        lines.push(`  > ${d.context}`);
      }
    }
    lines.push('');
  }

  if (summary.open_questions.length > 0) {
    lines.push('## Open Questions');
    lines.push('');
    for (const q of summary.open_questions) {
      lines.push(`- ${q.question}`);
      if (q.context) {
        lines.push(`  > ${q.context}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
