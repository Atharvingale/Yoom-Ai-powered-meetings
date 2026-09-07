import { MeetingSummaryResult } from '@/lib/ai/provider';
import { exportSummaryAsPDF } from './pdf';
import { exportSummaryAsMarkdown } from './markdown';
import { exportSummaryAsJSON } from './json';
import { exportSummaryAsText } from './text';

export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'text';

function getExtension(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'pdf';
    case 'markdown':
      return 'md';
    case 'json':
      return 'json';
    case 'text':
      return 'txt';
  }
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'markdown':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    case 'text':
      return 'text/plain';
  }
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function exportSummary(
  format: ExportFormat,
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date,
): Promise<void> {
  const safeTitle = sanitizeFilename(meetingTitle || 'meeting-summary');

  if (format === 'pdf') {
    const blob = await exportSummaryAsPDF(summary, meetingTitle, meetingDate);
    downloadBlob(blob, `${safeTitle}.pdf`);
    return;
  }

  let content: string;

  switch (format) {
    case 'markdown':
      content = exportSummaryAsMarkdown(summary, meetingTitle, meetingDate);
      break;
    case 'json':
      content = exportSummaryAsJSON(summary, meetingTitle, meetingDate);
      break;
    case 'text':
      content = exportSummaryAsText(summary, meetingTitle, meetingDate);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const blob = new Blob([content], { type: getMimeType(format) });
  downloadBlob(blob, `${safeTitle}.${getExtension(format)}`);
}
