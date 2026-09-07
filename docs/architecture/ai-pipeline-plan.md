# YOOM AI Pipeline Architecture Plan

## Recording Retrieval Analysis (GetStream Video SDK)

### Key Findings from GetStream Documentation

| Property | Value |
|----------|-------|
| **Recording URL** | `CallRecording.url` — signed HTTPS URL to Stream-managed S3/CDN |
| **Accessibility** | **Publicly reachable** — no auth header needed; signature embedded in URL query params |
| **Expiry** | **2 weeks** (signed URL TTL = retention period) |
| **Retention** | 2 weeks, then auto-deleted from Stream storage |
| **Content Type** | Configurable per call-type: `audio_only`, `video_only`, `audio_video`, `screenshare_*` variants |
| **Default (individual)** | `audio_video` + `screenshare_audio_video` (combined audio+video MP4 per participant) |
| **Default (composite)** | Single MP4 (grid/spotlight layout); can set `audio_only: true` for MP3 |
| **Server-side Access** | ✅ Works from Next.js server actions, Edge functions, Python scripts, `curl` |
| **Client-side Access** | ✅ Works directly in browser (current implementation) |

### Answers to Mandatory Questions

1. **Does `useGetCalls`'s `callRecordings` return a downloadable URL, and is it audio-only or audio+video?**
   - Yes. `meeting.queryRecordings()` → `CallRecording[]` each with `.url` (signed download link).
   - **Content depends on recording config**: default individual recording = `audio_video` (combined audio+video MP4 per participant). Composite = single MP4 (or MP3 if `audio_only: true`).

2. **Is that URL reachable from a Next.js server action, or only from the authenticated browser?**
   - **Reachable from anywhere** — signed URL contains HMAC in query string. No cookies, no headers, no Stream session required.

3. **Is it time-limited? What's the expiry window?**
   - **Yes, 2 weeks**. Both the signed URL and the underlying object expire after 14 days.

4. **Can a local Python process reach it directly, or does it need to be proxied through Next.js first?**
   - **Direct access works**. Python `requests.get(url)` / `httpx.AsyncClient().get(url)` succeeds without proxy.

---

## Local-Inference Bridge Architecture

### Goal
Run GPU-heavy AI (Whisper, diarization, embeddings, LLM summarization) on the **user's machine** via a **FastAPI sidecar** bound to `127.0.0.1:8765`, invoked from Next.js **Server Actions**.

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S MACHINE                               │
│  ┌──────────────────┐         ┌────────────────────────────────┐   │
│  │  Next.js App     │         │  FastAPI Sidecar (127.0.0.1)   │   │
│  │  (Server Actions)│────────▶│  Port 8765                     │   │
│  │                  │  HTTP   │  /infer/transcribe             │   │
│  │  - fetch URL     │  POST   │  /infer/diarize                │   │
│  │  - call sidecar  │         │  /infer/embed                  │   │
│  │  - store result  │         │  /infer/summarize              │   │
│  └──────────────────┘         └────────────────────────────────┘   │
│          │                              │                            │
│          │                              ▼                            │
│          │                    ┌───────────────────────┐             │
│          │                    │  Local Models Cache   │             │
│          └───────────────────▶│  ~/.cache/yoom/models │             │
│                               └───────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User clicks "Process Recording"** on a meeting card (recordings page)
2. **Server Action** (`actions/ai-pipeline.actions.ts`):
   - Receives `recordingUrl` (GetStream signed URL) + `meetingId`
   - Calls `POST http://127.0.0.1:8765/infer/transcribe` with `{ url, meetingId }`
   - Polls `/infer/status/{jobId}` until `completed`
   - Writes results to DB (Supabase/Postgres): `transcript`, `diarization`, `embeddings`, `summary`
3. **FastAPI Sidecar**:
   - Downloads recording via `httpx` (streaming to temp file)
   - Runs pipeline: `ffmpeg → Whisper → pyannote → sentence-transformers → LLM`
   - Stores artifacts in `~/.cache/yoom/jobs/{jobId}/`
   - Returns JSON with paths/results

### FastAPI Sidecar Spec

**File**: `sidecar/main.py`

```python
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, HttpUrl
import httpx, uuid, asyncio, os
from pathlib import Path

app = FastAPI(title="YOOM Local AI Sidecar")
JOBS_DIR = Path.home() / ".cache" / "yoom" / "jobs"
JOBS_DIR.mkdir(parents=True, exist_ok=True)

class TranscribeRequest(BaseModel):
    url: HttpUrl
    meeting_id: str
    language: str | None = None

class JobStatus(BaseModel):
    job_id: str
    status: str  # queued | downloading | transcribing | diarizing | embedding | summarizing | completed | failed
    progress: float
    result: dict | None = None
    error: str | None = None

jobs: dict[str, JobStatus] = {}

async def download_recording(url: str, dest: Path) -> Path:
    async with httpx.AsyncClient(timeout=300) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()
            async with open(dest, "wb") as f:
                async for chunk in resp.aiter_bytes(1024 * 1024):
                    f.write(chunk)
    return dest

async def run_pipeline(job_id: str, url: str, meeting_id: str):
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir()
    jobs[job_id] = JobStatus(job_id=job_id, status="downloading", progress=0.0)
    
    # 1. Download
    audio_path = job_dir / "audio.wav"
    await download_recording(url, audio_path)
    jobs[job_id].status = "transcribing"; jobs[job_id].progress = 0.2
    
    # 2. Whisper (faster-whisper)
    from faster_whisper import WhisperModel
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    segments, _ = model.transcribe(str(audio_path), beam_size=5, vad_filter=True)
    transcript = [{"start": s.start, "end": s.end, "text": s.text} for s in segments]
    jobs[job_id].progress = 0.5
    
    # 3. Diarization (pyannote)
    from pyannote.audio import Pipeline
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token=os.getenv("HF_TOKEN"))
    diarization = pipeline(str(audio_path))
    # merge with transcript → speaker-labeled segments
    jobs[job_id].progress = 0.7
    
    # 4. Embeddings (sentence-transformers)
    from sentence_transformers import SentenceTransformer
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = embedder.encode([s["text"] for s in transcript]).tolist()
    jobs[job_id].progress = 0.85
    
    # 5. Summarization (local LLM via Ollama or transformers)
    # ... summarize transcript ...
    
    jobs[job_id] = JobStatus(
        job_id=job_id, status="completed", progress=1.0,
        result={"transcript": transcript, "diarization": ..., "embeddings": embeddings, "summary": "..."}
    )

@app.post("/infer/transcribe")
async def transcribe(req: TranscribeRequest, bg: BackgroundTasks):
    job_id = uuid.uuid4().hex[:12]
    bg.add_task(run_pipeline, job_id, str(req.url), req.meeting_id)
    return {"job_id": job_id}

@app.get("/infer/status/{job_id}")
async def status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]
```

### Next.js Server Action

**File**: `actions/ai-pipeline.actions.ts`

```typescript
'use server';

export async function processRecording(recordingUrl: string, meetingId: string) {
  const SIDECAR = process.env.YOOM_SIDECAR_URL ?? 'http://127.0.0.1:8765';
  
  const res = await fetch(`${SIDECAR}/infer/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: recordingUrl, meeting_id: meetingId }),
  });
  const { job_id } = await res.json();
  
  // Poll until completion
  while (true) {
    const statusRes = await fetch(`${SIDECAR}/infer/status/${job_id}`);
    const status = await statusRes.json();
    if (status.status === 'completed') {
      // Store in DB
      await db.transcripts.create({ meetingId, ...status.result });
      return status.result;
    }
    if (status.status === 'failed') throw new Error(status.error);
    await new Promise(r => setTimeout(r, 2000));
  }
}
```

### Deployment / Distribution

| Target | Method |
|--------|--------|
| **Developer machine** | `uv run sidecar/main.py` (or `python -m sidecar`) |
| **End-user (no Python)** | PyInstaller one-file binary (`yoom-sidecar`) shipped with Tauri/Electron wrapper or standalone installer |
| **Auto-start** | LaunchAgent (macOS) / systemd --user (Linux) / Task Scheduler (Windows) |

### Security Considerations

- Sidecar binds **only to 127.0.0.1** — no network exposure
- No auth on sidecar (local-only); if needed, add shared secret via env var
- Recording URLs are **already signed** — no extra credentials transit sidecar
- Temp files cleaned up after job completion (TTL 24h)

### Environment Variables

```bash
# .env.local (Next.js)
YOOM_SIDECAR_URL=http://127.0.0.1:8765

# Sidecar .env
HF_TOKEN=hf_xxx           # for pyannote
OLLAMA_HOST=http://127.0.0.1:11434  # optional local LLM
```

### Next Steps

1. Scaffold `sidecar/` with `pyproject.toml` (uv/poetry)
2. Implement pipeline steps incrementally (Whisper → diarization → embeddings → summary)
3. Add Server Action + UI button "Generate AI Notes" on recording cards
4. Persist results to DB; display in MeetingDetail page
5. Package sidecar binary for non-dev users