# YOOM local transcription sidecar

Install Python dependencies, then start the loopback-only service:

```bash
python -m venv .venv
.venv/bin/pip install -r sidecar/requirements.txt
.venv/bin/python sidecar/main.py
```

On Windows, use `.venv\\Scripts\\pip` and `.venv\\Scripts\\python`.

The service listens only on `127.0.0.1:8765`. The Next.js app sends signed Stream recording URLs to `POST /infer/transcribe` and polls `GET /infer/status/{job_id}`. Set `WHISPER_MODEL`, `WHISPER_DEVICE`, and `WHISPER_COMPUTE_TYPE` to tune local inference.
