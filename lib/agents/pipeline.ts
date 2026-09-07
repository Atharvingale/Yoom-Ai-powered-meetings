import { AgentStatus } from './dispatcher';

export interface PipelineStatus {
  meetingId: string;
  transcription: AgentStatus;
  summary: AgentStatus;
  tts: AgentStatus;
  startedAt: Date;
  completedAt?: Date;
}

export interface PipelineInput {
  meetingId: string;
  recordingUrl?: string;
}

type PipelineTask = {
  id: 'transcription' | 'summary' | 'tts';
  timeout: number;
  execute: (input: PipelineInput) => Promise<void>;
};

const tasks: PipelineTask[] = [
  {
    id: 'transcription',
    timeout: 300000, // 5 minutes (allows model download + audio fetch)
    execute: async (input) => {
      const { processMeetingTranscription } = await import('@/lib/transcription');
      if (!input.recordingUrl) {
        throw new Error(`No recording URL provided for meeting ${input.meetingId}`);
      }
      await processMeetingTranscription(input.meetingId, input.recordingUrl);
    },
  },
  {
    id: 'summary',
    timeout: 180000, // 3 minutes (allows local LLM inference)
    execute: async (input) => {
      const { generateMeetingSummary } = await import('@/lib/ai');
      const { getTranscript } = await import('@/lib/supabase/transcripts');
      const transcript = await getTranscript(input.meetingId);
      if (!transcript || transcript.segments.length === 0) {
        throw new Error(`No transcript available for meeting ${input.meetingId}`);
      }
      await generateMeetingSummary(input.meetingId, transcript.segments);
    },
  },
  {
    id: 'tts',
    timeout: 60000, // 1 minute
    execute: async (input) => {
      const { getSummary } = await import('@/lib/supabase/summaries');
      const result = await getSummary(input.meetingId);
      if (!result?.summary) throw new Error(`No summary available for meeting ${input.meetingId}`);
    },
  },
];

async function runTask(task: PipelineTask, input: PipelineInput): Promise<AgentStatus> {
  try {
    await Promise.race([
      task.execute(input),
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Timeout')), task.timeout)),
    ]);
    return 'success';
  } catch (error) {
    return error instanceof Error && error.message === 'Timeout' ? 'timeout' : 'error';
  }
}

export async function runPostMeetingPipeline(
  meetingId: string,
  recordingUrl?: string,
  onStatusUpdate?: (status: PipelineStatus) => void,
): Promise<PipelineStatus> {
  const status: PipelineStatus = {
    meetingId,
    transcription: 'pending',
    summary: 'pending',
    tts: 'pending',
    startedAt: new Date(),
  };

  onStatusUpdate?.(status);

  const pipelineInput: PipelineInput = { meetingId, recordingUrl };

  for (const task of tasks) {
    status[task.id] = 'running';
    onStatusUpdate?.({ ...status });
    const result = await runTask(task, pipelineInput);
    status[task.id] = result;
    onStatusUpdate?.({ ...status });
    if (result !== 'success') break;
  }

  status.completedAt = new Date();

  onStatusUpdate?.(status);

  return status;
}
