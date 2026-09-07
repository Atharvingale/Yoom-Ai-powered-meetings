from __future__ import annotations

import asyncio
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

app = FastAPI(title='YOOM Local AI Sidecar')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

JOBS: dict[str, dict[str, Any]] = {}
JOBS_DIR = Path(os.getenv('YOOM_JOBS_DIR', Path.home() / '.cache' / 'yoom' / 'jobs'))
JOBS_DIR.mkdir(parents=True, exist_ok=True)


class TranscribeRequest(BaseModel):
    url: HttpUrl
    meeting_id: str
    language: str | None = None
    chunk_duration_seconds: int | None = None


async def download_recording(url: str, destination: Path) -> None:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    async with httpx.AsyncClient(timeout=300, headers=headers, follow_redirects=True) as client:
        async with client.stream('GET', url) as response:
            response.raise_for_status()
            with destination.open('wb') as output:
                async for chunk in response.aiter_bytes(1024 * 1024):
                    output.write(chunk)


def update_job(job_id: str, status: str, progress: float, **extra: Any) -> None:
    print(f'[Job {job_id}] Status: {status} | Progress: {progress * 100:.0f}%')
    JOBS[job_id] = {'job_id': job_id, 'status': status, 'progress': progress, **extra}


def _transcribe_sync(model: Any, audio_path: str, language: str | None) -> tuple[list[dict[str, Any]], Any]:
    segments, info = model.transcribe(
        audio_path,
        language=language,
        vad_filter=True,
    )
    transcript = [
        {'start': segment.start, 'end': segment.end, 'text': segment.text.strip()}
        for segment in segments
    ]
    return transcript, info


async def run_transcription(job_id: str, request: TranscribeRequest) -> None:
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    audio_path = job_dir / 'recording.mp4'

    try:
        update_job(job_id, 'downloading', 0.05)
        await download_recording(str(request.url), audio_path)
        update_job(job_id, 'transcribing', 0.25)

        from faster_whisper import WhisperModel

        model_name = os.getenv('WHISPER_MODEL', 'base')
        device = os.getenv('WHISPER_DEVICE', 'cpu')
        compute_type = os.getenv('WHISPER_COMPUTE_TYPE', 'int8')

        print(f'[Job {job_id}] Loading Whisper model "{model_name}" (device={device}, compute={compute_type})...')
        try:
            model = WhisperModel(model_name, device=device, compute_type=compute_type)
        except Exception as device_err:
            if 'cublas' in str(device_err).lower() or 'cuda' in str(device_err).lower():
                print(f'[Job {job_id}] GPU CUDA library missing ({device_err}). Falling back to device="cpu"...')
                model = WhisperModel(model_name, device='cpu', compute_type='int8')
            else:
                raise device_err

        print(f'[Job {job_id}] Transcribing {audio_path}...')
        transcript, info = await asyncio.to_thread(
            _transcribe_sync,
            model,
            str(audio_path),
            request.language,
        )
        print(f'[Job {job_id}] Transcribed {len(transcript)} segments successfully.')
        update_job(
            job_id,
            'completed',
            1.0,
            result={
                'transcript': transcript,
                'language': getattr(info, 'language', request.language or 'en'),
            },
        )
    except Exception as error:
        print(f'[Job {job_id}] Failed with error: {error}')
        update_job(job_id, 'failed', 1.0, error=str(error))
    finally:
        try:
            audio_path.unlink(missing_ok=True)
            job_dir.rmdir()
        except OSError:
            pass


@app.post('/infer/transcribe')
async def transcribe(request: TranscribeRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    job_id = uuid.uuid4().hex[:12]
    update_job(job_id, 'queued', 0.0)
    background_tasks.add_task(run_transcription, job_id, request)
    return {'job_id': job_id}


@app.get('/infer/status/{job_id}')
async def status(job_id: str) -> dict[str, Any]:
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='127.0.0.1', port=int(os.getenv('YOOM_SIDECAR_PORT', '8765')))
