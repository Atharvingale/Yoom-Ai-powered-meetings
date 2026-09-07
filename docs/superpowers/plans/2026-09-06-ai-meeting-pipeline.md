# YOOM AI Meeting Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the post-meeting intelligence path from a Stream recording to persisted transcript, summary, and user-visible exports.

**Architecture:** Supabase meetings are keyed by the Stream call ID in `stream_call_id`; the pipeline resolves or creates the parent meeting before processing. Transcription and summarization run sequentially because summarization depends on the saved transcript. The browser starts processing from a recording card and polls an authenticated server-action status store.

**Tech Stack:** Next.js 14 App Router, TypeScript, Clerk server actions, Stream Video SDK, Supabase Postgres/RLS, local Whisper sidecar, local Ollama, React/Tailwind.

**Spec:** Approved in chat on 2026-09-06: persistence and ID resolution, sequential agents, recording/post-meeting trigger, summary transcript/export wiring, and a minimal local sidecar.

## Global Constraints

- Do not expose server credentials or OpenAI keys to the browser.
- Keep the sidecar bound to `127.0.0.1`.
- Preserve existing Stream/Clerk meeting behavior.
- Summarization must not begin before transcription succeeds.
- Run typecheck and lint after implementation.

---

### Task 1: Pipeline primitives and persistence resolution

**Files:**
- Modify: `lib/supabase/meetings.ts`
- Modify: `lib/supabase/transcripts.ts`
- Create: `lib/agents/pipeline.test.ts`

**Interfaces:**
- Produce `getOrCreateMeetingByStreamCallId(streamCallId, clerkUserId, metadata)`.
- Produce an idempotent transcript save path for pipeline retries.
- Pipeline tests verify transcription precedes summary and failures prevent dependent work.

- [ ] Write failing tests for sequential execution and dependent failure behavior.
- [ ] Run the tests and confirm they fail for the missing behavior.
- [ ] Add the minimal meeting-resolution and transcript-upsert helpers.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Sequential post-meeting pipeline

**Files:**
- Modify: `lib/agents/dispatcher.ts`
- Modify: `lib/agents/pipeline.ts`
- Modify: `actions/agents.actions.ts`

**Interfaces:**
- `runPostMeetingPipeline(meetingId, recordingUrl, onStatusUpdate)` runs transcription, then summary, then TTS readiness.
- Status updates expose `pending`, `running`, `success`, `error`, and `timeout` states.
- `getAgentStatus` requires an authenticated Clerk user.

- [ ] Extend tests for status transitions and sequential ordering.
- [ ] Implement dependency-aware execution while preserving timeout handling.
- [ ] Store running status before long work and return final status on failure.
- [ ] Run focused tests.

### Task 3: Persistence and meeting creation wiring

**Files:**
- Modify: `components/MeetingTypeList.tsx`
- Modify: `app/(root)/(home)/personal-room/page.tsx`
- Modify: `components/EndCallButton.tsx`
- Modify: `actions/agents.actions.ts`

**Interfaces:**
- Every newly created Stream call gets a Supabase meeting row with `stream_call_id`.
- The pipeline can receive a Stream recording URL and resolve the matching meeting.
- Ending a call records `ended_at` where permitted.

- [ ] Add server action for authenticated meeting upsert.
- [ ] Call it after instant/scheduled/personal Stream call creation.
- [ ] Ensure duplicate creation is safe.
- [ ] Run typecheck.

### Task 4: User-facing processing trigger and summary wiring

**Files:**
- Modify: `components/CallList.tsx`
- Modify: `components/MeetingCard.tsx`
- Modify: `app/(root)/summary/[meetingId]/page.tsx`
- Modify: `components/SummaryView.tsx`

**Interfaces:**
- Recording cards expose “Generate AI Notes” and show `AgentStatus` while processing.
- Summary pages load transcript segments and mount `ExportMenu`.
- Stream call IDs are resolved before invoking pipeline actions.

- [ ] Add recording trigger UI and error state.
- [ ] Connect status polling and redirect to summary on success.
- [ ] Load transcript server-side and pass it to the summary view.
- [ ] Adapt export input to persisted summary data.
- [ ] Run typecheck and lint.

### Task 5: Minimal local sidecar

**Files:**
- Create: `sidecar/main.py`
- Create: `sidecar/requirements.txt`
- Create: `sidecar/README.md`
- Modify: `.env.example`

**Interfaces:**
- `POST /infer/transcribe` accepts `{url, meeting_id, language?}` and returns a job ID.
- `GET /infer/status/{job_id}` returns progress and completed transcript data.
- The server binds to `127.0.0.1:8765`.

- [ ] Add a dependency-light server scaffold with explicit job lifecycle.
- [ ] Use optional faster-whisper/pyannote imports only when a job runs.
- [ ] Return failed status rather than hanging on model errors.
- [ ] Document local startup and required model credentials.

### Task 6: Verification

**Files:**
- Modify: `package.json` only if a test script is added.

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run focused pipeline tests or the repository's available test command.
- [ ] Inspect the final diff and report any environment-dependent gaps.
