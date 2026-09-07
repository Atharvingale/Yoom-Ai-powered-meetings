'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAgentStatus } from '@/actions/agents.actions';
import type { PipelineStatus } from '@/lib/agents/pipeline';

interface AgentStatusProps {
  meetingId: string;
  onComplete?: () => void;
  className?: string;
}

interface AgentDisplay {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout';
  duration?: number;
}

function StatusIcon({ status }: { status: AgentDisplay['status'] }) {
  switch (status) {
    case 'running':
      return <Loader2 size={18} className="animate-spin text-blue-1" />;
    case 'success':
      return <CheckCircle2 size={18} className="text-green-400" />;
    case 'error':
      return <XCircle size={18} className="text-red-400" />;
    case 'timeout':
      return <AlertTriangle size={18} className="text-yellow-400" />;
    default:
      return <Clock size={18} className="text-sky-3" />;
  }
}

function StatusBadge({ status }: { status: AgentDisplay['status'] }) {
  const styles: Record<string, string> = {
    pending: 'bg-dark-3 text-sky-3',
    running: 'bg-blue-1/20 text-blue-1',
    success: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
    timeout: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', styles[status])}>
      {status}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function AgentCard({ agent }: { agent: AgentDisplay }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-[14px] border px-4 py-3 transition-all',
        agent.status === 'running'
          ? 'border-blue-1/30 bg-dark-1'
          : agent.status === 'success'
            ? 'border-green-400/20 bg-dark-1'
            : agent.status === 'error' || agent.status === 'timeout'
              ? 'border-red-400/20 bg-dark-1'
              : 'border-dark-3 bg-dark-2',
      )}
    >
      <div className="flex items-center gap-3">
        <StatusIcon status={agent.status} />
        <span className="text-sm font-medium text-white">{agent.name}</span>
      </div>
      <div className="flex items-center gap-3">
        {agent.duration !== undefined && (
          <span className="text-xs text-sky-3">{formatDuration(agent.duration)}</span>
        )}
        <StatusBadge status={agent.status} />
      </div>
    </div>
  );
}

export function AgentStatus({ meetingId, onComplete, className }: AgentStatusProps) {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const result = await getAgentStatus(meetingId);
      if (result) {
        setStatus(result);
        if (result.completedAt) {
          onComplete?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    }
  }, [meetingId, onComplete]);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      if (!status?.completedAt) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus, status?.completedAt]);

  if (error) {
    return (
      <div className={cn('rounded-[14px] border border-red-400/20 bg-dark-1 p-4', className)}>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={cn('rounded-[14px] border border-dark-3 bg-dark-1 p-4', className)}>
        <div className="flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-sky-3" />
          <span className="text-sm text-sky-3">Initializing pipeline...</span>
        </div>
      </div>
    );
  }

  const agents: AgentDisplay[] = [
    { name: 'Transcription', status: status.transcription },
    { name: 'Summarization', status: status.summary },
    { name: 'TTS Generation', status: status.tts },
  ];

  const isComplete = !!status.completedAt;
  const allSuccess = agents.every((a) => a.status === 'success');
  const hasFailures = agents.some((a) => a.status === 'error' || a.status === 'timeout');

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Processing Status</h3>
        {isComplete && status.completedAt && (
          <span className="text-xs text-sky-3">
            Completed in {formatDuration(new Date(status.completedAt).getTime() - new Date(status.startedAt).getTime())}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {agents.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </div>

      {isComplete && allSuccess && (
        <button
          onClick={onComplete}
          className="w-full rounded-[14px] bg-blue-1 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-1/80"
        >
          View Summary
        </button>
      )}

      {isComplete && hasFailures && (
        <button
          onClick={() => {
            setError(null);
            setStatus(null);
          }}
          className="w-full rounded-[14px] border border-dark-3 bg-dark-2 px-4 py-2.5 text-sm font-medium text-sky-2 transition-colors hover:bg-dark-3"
        >
          Retry Failed
        </button>
      )}
    </div>
  );
}
