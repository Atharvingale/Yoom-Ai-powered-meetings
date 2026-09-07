CREATE UNIQUE INDEX IF NOT EXISTS meetings_stream_call_id_key
  ON meetings(stream_call_id)
  WHERE stream_call_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transcripts_meeting_id_key
  ON transcripts(meeting_id);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_summaries_meeting_id_key
  ON meeting_summaries(meeting_id);
