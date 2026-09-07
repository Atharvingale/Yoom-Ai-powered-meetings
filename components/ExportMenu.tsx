'use client';

import { useState } from 'react';
import {
  Download,
  FileText,
  Code,
  Braces,
  File,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { MeetingSummaryResult } from '@/lib/ai/provider';
import { ExportFormat } from '@/lib/download';
import { exportSummaryAsMarkdown } from '@/lib/download/markdown';
import { useExport } from '@/hooks/useExport';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ExportMenuProps {
  summary: MeetingSummaryResult;
  meetingTitle: string;
  meetingDate: Date;
  onExport?: (format: ExportFormat) => void;
}

const FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  icon: typeof FileText;
}[] = [
  { format: 'pdf', label: 'PDF Download', icon: FileText },
  { format: 'markdown', label: 'Markdown', icon: Code },
  { format: 'json', label: 'JSON', icon: Braces },
  { format: 'text', label: 'Plain Text', icon: File },
];

export function ExportMenu({ summary, meetingTitle, meetingDate, onExport }: ExportMenuProps) {
  const { exportAs, copySummaryToClipboard, isExporting, copied } = useExport();
  const [open, setOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    await exportAs(format, summary, meetingTitle, meetingDate);
    onExport?.(format);
    setOpen(false);
  };

  const handleCopy = async () => {
    const text = exportSummaryAsMarkdown(summary, meetingTitle, meetingDate);
    await copySummaryToClipboard(text);
    setTimeout(() => setOpen(false), 800);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dark-3 bg-dark-2 text-sky-1 hover:bg-dark-3"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {FORMAT_OPTIONS.map(({ format, label, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            className="gap-2 cursor-pointer"
          >
            <Icon size={16} className="text-sky-2" />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
          {copied ? (
            <Check size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-sky-2" />
          )}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
