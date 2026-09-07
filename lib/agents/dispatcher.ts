export interface AgentTask<TInput, TOutput> {
  id: string;
  name: string;
  execute(input: TInput): Promise<TOutput>;
  timeout?: number;
}

export type AgentStatus = 'pending' | 'running' | 'success' | 'error' | 'timeout';

export interface AgentResult<T> {
  taskId: string;
  status: AgentStatus;
  data?: T;
  error?: string;
  duration: number;
}

type TaskMap = Record<string, AgentTask<unknown, unknown>>;
type InputMap = Record<string, unknown>;
// eslint-disable-next-line no-unused-vars
type MappedResult<T> = { [K in keyof T]: AgentResult<unknown> };

export async function dispatchAgents<
  TTaskMap extends TaskMap,
  TInputMap extends InputMap,
>(
  tasks: TTaskMap,
  inputs: TInputMap,
): Promise<MappedResult<TTaskMap>> {
  const entries = Object.entries(tasks) as [string, AgentTask<unknown, unknown>][];

  const results = await Promise.allSettled(
    entries.map(async ([key, task]) => {
      const input = inputs[key as keyof TInputMap];
      const startTime = Date.now();

      try {
        const timeout = task.timeout || 30000;
        const result = await Promise.race([
          task.execute(input),
          new Promise<never>(
            (_resolve, reject) =>
              setTimeout(() => reject(new Error('Timeout')), timeout),
          ),
        ]);

        return {
          taskId: task.id,
          status: 'success' as const,
          data: result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        const isTimeout =
          error instanceof Error && error.message === 'Timeout';
        return {
          taskId: task.id,
          status: (isTimeout ? 'timeout' : 'error') as AgentStatus,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        };
      }
    }),
  );

  const output = {} as MappedResult<TTaskMap>;
  entries.forEach(([key], index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      output[key as keyof TTaskMap] = result.value as AgentResult<unknown>;
    } else {
      output[key as keyof TTaskMap] = {
        taskId: key,
        status: 'error',
        error: result.reason?.message || 'Unknown error',
        duration: 0,
      };
    }
  });

  return output;
}
