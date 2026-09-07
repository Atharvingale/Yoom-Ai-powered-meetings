export type ProvenanceType = 'explicit' | 'inferred' | 'mixed';

export interface ActionItemInput {
  task: string;
  assignee?: string;
  context?: string;
  status?: 'open' | 'done';
  timestamp?: string;
}

export interface DecisionInput {
  decision: string;
  context?: string;
  timestamp?: string;
}

export interface OpenQuestionInput {
  question: string;
  context?: string;
  timestamp?: string;
}

export interface MeetingSummaryResult {
  overview: string;
  provenance: ProvenanceType;
  action_items: ActionItemInput[];
  decisions: DecisionInput[];
  open_questions: OpenQuestionInput[];
  model: string;
}

export interface SummarizeOptions {
  model?: string;
  maxChunkCharacters?: number;
}

export interface AIProvider {
  name: string;
  summarize(
    transcriptText: string,
    segments?: Array<{ speaker_label?: string | null; text: string }>,
    options?: SummarizeOptions
  ): Promise<MeetingSummaryResult>;
}
