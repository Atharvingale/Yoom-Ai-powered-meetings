-- YOOM Supabase Schema
-- Created: 2026-08-19

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    stream_call_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- meeting_participants table
CREATE TABLE meeting_participants (
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (meeting_id, clerk_user_id)
);

-- transcripts table
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    language TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- transcript_segments table
CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    speaker_label TEXT,
    start_ms BIGINT NOT NULL,
    end_ms BIGINT NOT NULL,
    text TEXT NOT NULL
);

-- meeting_summaries table
CREATE TABLE meeting_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    overview TEXT NOT NULL,
    model TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- action_items table
CREATE TABLE action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    assignee TEXT,
    context TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- decisions table
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    decision TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- open_questions table
CREATE TABLE open_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for hot queries
CREATE INDEX idx_meetings_clerk_user_id ON meetings(clerk_user_id);
CREATE INDEX idx_meetings_starts_at ON meetings(starts_at DESC);
CREATE INDEX idx_meeting_participants_clerk_user_id ON meeting_participants(clerk_user_id);
CREATE INDEX idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);
CREATE INDEX idx_meeting_summaries_meeting_id ON meeting_summaries(meeting_id);
CREATE INDEX idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX idx_open_questions_meeting_id ON open_questions(meeting_id);

-- RLS policies (implemented in Task 2: yoom-security)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_questions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's Clerk ID from JWT
-- The supabase client forwards Clerk JWT with template 'supabase', so sub claim is available
CREATE OR REPLACE FUNCTION current_clerk_user_id() RETURNS TEXT AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'sub')::TEXT;
$$ LANGUAGE sql STABLE;

-- meetings: creator + members (participants) can view; only creator can insert/update/delete
CREATE POLICY "Users can view meetings they created or participate in" ON meetings
    FOR SELECT USING (
        clerk_user_id = current_clerk_user_id()
        OR EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = meetings.id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "Users can insert their own meetings" ON meetings
    FOR INSERT WITH CHECK (clerk_user_id = current_clerk_user_id());
CREATE POLICY "Users can update their own meetings" ON meetings
    FOR UPDATE USING (clerk_user_id = current_clerk_user_id())
    WITH CHECK (clerk_user_id = current_clerk_user_id());
CREATE POLICY "Users can delete their own meetings" ON meetings
    FOR DELETE USING (clerk_user_id = current_clerk_user_id());

-- meeting_participants: users can view participants of meetings they have access to
-- Only meeting creator can add/remove participants
CREATE POLICY "Users can view participants of accessible meetings" ON meeting_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE id = meeting_participants.meeting_id
            AND (
                clerk_user_id = current_clerk_user_id()
                OR EXISTS (
                    SELECT 1 FROM meeting_participants mp2
                    WHERE mp2.meeting_id = meetings.id
                    AND mp2.clerk_user_id = current_clerk_user_id()
                    AND mp2.left_at IS NULL
                )
            )
        )
    );
CREATE POLICY "Meeting creators can add participants" ON meeting_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE id = meeting_participants.meeting_id
            AND clerk_user_id = current_clerk_user_id()
        )
    );
CREATE POLICY "Meeting creators can remove participants" ON meeting_participants
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meetings
            WHERE id = meeting_participants.meeting_id
            AND clerk_user_id = current_clerk_user_id()
        )
    );
CREATE POLICY "Participants can update their own left_at" ON meeting_participants
    FOR UPDATE USING (clerk_user_id = current_clerk_user_id())
    WITH CHECK (clerk_user_id = current_clerk_user_id());

-- transcripts: only meeting participants (at time of query) can view
CREATE POLICY "Participants can view transcripts" ON transcripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = transcripts.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "System can insert transcripts" ON transcripts
    FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update transcripts" ON transcripts
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- transcript_segments: only meeting participants can view
CREATE POLICY "Participants can view transcript segments" ON transcript_segments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transcripts t
            JOIN meeting_participants mp ON mp.meeting_id = t.meeting_id
            WHERE t.id = transcript_segments.transcript_id
            AND mp.clerk_user_id = current_clerk_user_id()
            AND mp.left_at IS NULL
        )
    );
CREATE POLICY "System can insert transcript segments" ON transcript_segments
    FOR INSERT WITH CHECK (true);

-- meeting_summaries: only meeting participants can view
CREATE POLICY "Participants can view meeting summaries" ON meeting_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = meeting_summaries.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "System can insert meeting summaries" ON meeting_summaries
    FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update meeting summaries" ON meeting_summaries
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- action_items: only meeting participants can view
CREATE POLICY "Participants can view action items" ON action_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = action_items.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "System can insert action items" ON action_items
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update their assigned action items" ON action_items
    FOR UPDATE USING (
        assignee = current_clerk_user_id()
        AND EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = action_items.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    )
    WITH CHECK (
        assignee = current_clerk_user_id()
        AND EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = action_items.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );

-- decisions: only meeting participants can view
CREATE POLICY "Participants can view decisions" ON decisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = decisions.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "System can insert decisions" ON decisions
    FOR INSERT WITH CHECK (true);

-- open_questions: only meeting participants can view
CREATE POLICY "Participants can view open questions" ON open_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants
            WHERE meeting_id = open_questions.meeting_id
            AND clerk_user_id = current_clerk_user_id()
            AND left_at IS NULL
        )
    );
CREATE POLICY "System can insert open questions" ON open_questions
    FOR INSERT WITH CHECK (true);