/* eslint-disable camelcase */
import { createSupabaseServerClient } from './server';
import { getMeetingByStreamCallId } from './meetings';

export interface MeetingSummaryRecord {
  id: string;
  meeting_id: string;
  overview: string;
  model: string;
  generated_at: string;
}

export interface ActionItemRecord {
  id: string;
  meeting_id: string;
  task: string;
  assignee: string | null;
  context: string | null;
  status: 'open' | 'done';
  created_at: string;
}

export interface DecisionRecord {
  id: string;
  meeting_id: string;
  decision: string;
  context: string | null;
  created_at: string;
}

export interface OpenQuestionRecord {
  id: string;
  meeting_id: string;
  question: string;
  context: string | null;
  created_at: string;
}

export interface FullMeetingSummary {
  id: string;
  meeting_id: string;
  overview: string;
  model: string;
  generated_at: string;
  meetings: {
    title: string;
    description: string;
    starts_at: string;
    ended_at: string;
  };
  action_items: ActionItemRecord[];
  decisions: DecisionRecord[];
  open_questions: OpenQuestionRecord[];
}

export interface SummaryWithMeeting extends FullMeetingSummary {
  action_items_count: number;
  decisions_count: number;
}

export interface SaveSummaryInput {
  meeting_id: string;
  overview: string;
  model: string;
  action_items?: Array<{
    task: string;
    assignee?: string;
    context?: string;
    status?: 'open' | 'done';
  }>;
  decisions?: Array<{
    decision: string;
    context?: string;
  }>;
  open_questions?: Array<{
    question: string;
    context?: string;
  }>;
}

export async function saveSummary(input: SaveSummaryInput): Promise<MeetingSummaryRecord> {
  const supabase = await createSupabaseServerClient();

  const { data: summary, error: summaryError } = await supabase
    .from('meeting_summaries')
    .upsert(
      {
        meeting_id: input.meeting_id,
        overview: input.overview,
        model: input.model,
      },
      { onConflict: 'meeting_id' }
    )
    .select()
    .single();

  if (summaryError) throw new Error(`Failed to save summary: ${summaryError.message}`);

  const [{ error: actionItemsDeleteError }, { error: decisionsDeleteError }, { error: questionsDeleteError }] = await Promise.all([
    supabase.from('action_items').delete().eq('meeting_id', input.meeting_id),
    supabase.from('decisions').delete().eq('meeting_id', input.meeting_id),
    supabase.from('open_questions').delete().eq('meeting_id', input.meeting_id),
  ]);

  if (actionItemsDeleteError || decisionsDeleteError || questionsDeleteError) {
    throw new Error('Failed to reset existing summary details');
  }

  if (input.action_items && input.action_items.length > 0) {
    const { error } = await supabase.from('action_items').insert(
      input.action_items.map((item) => ({
        meeting_id: input.meeting_id,
        task: item.task,
        assignee: item.assignee,
        context: item.context,
        status: item.status ?? 'open',
      }))
    );
    if (error) throw new Error(`Failed to save action items: ${error.message}`);
  }

  if (input.decisions && input.decisions.length > 0) {
    const { error } = await supabase.from('decisions').insert(
      input.decisions.map((d) => ({
        meeting_id: input.meeting_id,
        decision: d.decision,
        context: d.context,
      }))
    );
    if (error) throw new Error(`Failed to save decisions: ${error.message}`);
  }

  if (input.open_questions && input.open_questions.length > 0) {
    const { error } = await supabase.from('open_questions').insert(
      input.open_questions.map((q) => ({
        meeting_id: input.meeting_id,
        question: q.question,
        context: q.context,
      }))
    );
    if (error) throw new Error(`Failed to save open questions: ${error.message}`);
  }

  return summary;
}

export async function getSummary(meetingId: string): Promise<{
  summary: MeetingSummaryRecord | null;
  action_items: ActionItemRecord[];
  decisions: DecisionRecord[];
  open_questions: OpenQuestionRecord[];
} | null> {
  const supabase = await createSupabaseServerClient();

  const { data: summary, error: summaryError } = await supabase
    .from('meeting_summaries')
    .select('*')
    .eq('meeting_id', meetingId)
    .single();

  if (summaryError) {
    if (summaryError.code === 'PGRST116') return null;
    throw new Error(`Failed to get summary: ${summaryError.message}`);
  }

  const [{ data: action_items }, { data: decisions }, { data: open_questions }] = await Promise.all([
    supabase.from('action_items').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true }),
    supabase.from('decisions').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true }),
    supabase.from('open_questions').select('*').eq('meeting_id', meetingId).order('created_at', { ascending: true }),
  ]);

  return {
    summary,
    action_items: action_items ?? [],
    decisions: decisions ?? [],
    open_questions: open_questions ?? [],
  };
}

export async function getSummaryByMeetingId(meetingId: string): Promise<FullMeetingSummary | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const resolvedMeeting = await getMeetingByStreamCallId(meetingId);
    const targetMeetingId = resolvedMeeting?.id || meetingId;

    const { data: summary, error: summaryError } = await supabase
      .from('meeting_summaries')
      .select('*')
      .eq('meeting_id', targetMeetingId)
      .single();

    if (summaryError) {
      if (summaryError.code === 'PGRST116' || summaryError.message?.includes('Not Found')) return null;
      console.warn('[Supabase Warning] getSummaryByMeetingId failed:', summaryError.message);
      return null;
    }

    const [meetingRes, actionItemsRes, decisionsRes, questionsRes] = await Promise.all([
      supabase.from('meetings').select('title, description, starts_at, ended_at').eq('id', targetMeetingId).single(),
      supabase.from('action_items').select('*').eq('meeting_id', targetMeetingId).order('created_at', { ascending: true }),
      supabase.from('decisions').select('*').eq('meeting_id', targetMeetingId).order('created_at', { ascending: true }),
      supabase.from('open_questions').select('*').eq('meeting_id', targetMeetingId).order('created_at', { ascending: true }),
    ]);

    return {
      id: summary.id,
      meeting_id: summary.meeting_id,
      overview: summary.overview,
      model: summary.model,
      generated_at: summary.generated_at,
      meetings: meetingRes.data || {
        title: 'Meeting Summary',
        description: '',
        starts_at: summary.generated_at,
        ended_at: summary.generated_at,
      },
      action_items: actionItemsRes.data ?? [],
      decisions: decisionsRes.data ?? [],
      open_questions: questionsRes.data ?? [],
    };
  } catch (err) {
    console.warn('[Supabase Exception] getSummaryByMeetingId failed:', err);
    return null;
  }
}

export async function updateActionItemStatus(
  actionItemId: string,
  status: 'open' | 'done'
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('action_items')
    .update({ status })
    .eq('id', actionItemId);

  if (error) throw new Error(`Failed to update action item: ${error.message}`);
}

export async function deleteSummary(summaryId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('meeting_summaries')
    .delete()
    .eq('id', summaryId);

  if (error) throw new Error(`Failed to delete summary: ${error.message}`);
}

export async function listSummaries(): Promise<SummaryWithMeeting[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: summaries, error } = await supabase
      .from('meeting_summaries')
      .select('*, meetings(title, description, starts_at, ended_at)')
      .order('generated_at', { ascending: false });

    if (error || !summaries) return [];

    const fullSummaries = await Promise.all(
      summaries.map(async (s) => {
        const [actionRes, decisionRes, questionRes] = await Promise.all([
          supabase.from('action_items').select('*', { count: 'exact' }).eq('meeting_id', s.meeting_id),
          supabase.from('decisions').select('*', { count: 'exact' }).eq('meeting_id', s.meeting_id),
          supabase.from('open_questions').select('*', { count: 'exact' }).eq('meeting_id', s.meeting_id),
        ]);

        return {
          id: s.id,
          meeting_id: s.meeting_id,
          overview: s.overview,
          model: s.model,
          generated_at: s.generated_at,
          meetings: s.meetings || {
            title: 'Meeting Summary',
            description: '',
            starts_at: s.generated_at,
            ended_at: s.generated_at,
          },
          action_items: actionRes.data || [],
          decisions: decisionRes.data || [],
          open_questions: questionRes.data || [],
          action_items_count: actionRes.count || 0,
          decisions_count: decisionRes.count || 0,
        };
      })
    );

    return fullSummaries;
  } catch (err) {
    console.warn('[Supabase Exception] listSummaries failed:', err);
    return [];
  }
}