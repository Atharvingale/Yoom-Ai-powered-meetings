'use client';

import { useState } from 'react';
import { MeetingSummaryResult } from '@/lib/ai/provider';
import { ExportFormat, exportSummary, copyToClipboard } from '@/lib/download';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportAs = async (
    format: ExportFormat,
    summary: MeetingSummaryResult,
    title: string,
    date: Date,
  ) => {
    setIsExporting(true);
    setLastError(null);
    try {
      await exportSummary(format, summary, title, date);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const copySummaryToClipboard = async (text: string) => {
    setIsExporting(true);
    setLastError(null);
    setCopied(false);
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Copy failed');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportAs, copySummaryToClipboard, isExporting, lastError, copied };
}
