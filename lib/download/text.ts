import { MeetingSummaryResult } from '@/lib/ai/provider';

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function divider() {
  return '─'.repeat(60);
}

export function exportSummaryAsText(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date,
): string {
  const lines: string[] = [];

  lines.push('YOOM MEETING SUMMARY');
  lines.push(divider());
  lines.push(`Title:  ${meetingTitle}`);
  lines.push(`Date:   ${formatDate(meetingDate)}`);
  lines.push(`Model:  ${summary.model}`);
  lines.push(divider());
  lines.push('');

  lines.push('OVERVIEW');
  lines.push(divider());
  lines.push(summary.overview);
  lines.push('');

  if (summary.action_items.length > 0) {
    lines.push('ACTION ITEMS');
    lines.push(divider());
    for (const item of summary.action_items) {
      const status = item.status === 'done' ? '[DONE]' : '[OPEN]';
      const assignee = item.assignee ? ` (${item.assignee})` : '';
      lines.push(`  ${status} ${item.task}${assignee}`);
      if (item.context) {
        lines.push(`         ${item.context}`);
      }
    }
    lines.push('');
  }

  if (summary.decisions.length > 0) {
    lines.push('DECISIONS');
    lines.push(divider());
    for (const d of summary.decisions) {
      lines.push(`  • ${d.decision}`);
      if (d.context) {
        lines.push(`    ${d.context}`);
      }
    }
    lines.push('');
  }

  if (summary.open_questions.length > 0) {
    lines.push('OPEN QUESTIONS');
    lines.push(divider());
    for (const q of summary.open_questions) {
      lines.push(`  ? ${q.question}`);
      if (q.context) {
        lines.push(`    ${q.context}`);
      }
    }
    lines.push('');
  }

  lines.push(divider());
  lines.push(`Exported from YOOM on ${formatDate(new Date())}`);

  return lines.join('\n');
}
