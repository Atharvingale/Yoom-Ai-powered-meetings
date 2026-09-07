<div align="center">
  <h1>⚡ YOOM</h1>
  <p><b>AI-Powered Video Conferencing & Intelligent Meeting Platform</b></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk Auth" />
    <img src="https://img.shields.io/badge/Stream-Video_SDK-005FFF?style=for-the-badge&logo=stream&logoColor=white" alt="Stream SDK" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/FastAPI-Sidecar-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  </p>
</div>

---

## 📌 Overview

**YOOM** is a production-grade, real-time video conferencing web application and AI meeting assistant. It provides high-performance audio/video calls alongside an automated post-meeting AI processing pipeline that extracts **speaker-diarized transcripts**, **timestamped action items**, **key decisions**, and **audio summaries**.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| ⚡ **Instant & Scheduled Meetings** | Quick-start instant video calls or schedule future sessions with custom start times and description fields. |
| 🎛️ **In-Meeting Experience** | HD Video & Audio, Screen Sharing, Reactions, Grid/Speaker layouts, and live in-call transcript streaming. |
| 🚪 **Personal Meeting Room** | Permanent personal room link for instant, friction-free meeting joins. |
| 🎙️ **Local AI Transcription** | Python sidecar microservice powered by `faster-whisper` for fast local speech-to-text. |
| 🗣️ **Speaker Diarization** | Speaker identification (`Speaker 1`, `Speaker 2`) using `pyannote.audio` neural acoustic clustering. |
| 🧠 **Automated AI Summaries** | Structured summary generation using local LLMs (Ollama `llama3.2` / `qwen3:8b`) with explicit timestamp badges (`[01:23]`). |
| 🔊 **Text-to-Speech (TTS)** | Read-aloud summary audio briefs with OpenAI TTS API and Web Speech API fallback. |
| 📄 **Multi-Format Document Export** | Export meeting summaries into **PDF** (`@react-pdf/renderer`), **Markdown**, **JSON**, and **Text** files. |
| 🔒 **Authentication & Row Security** | Clerk authentication paired with Supabase PostgreSQL Row Level Security (RLS) policies. |

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                         │
│ Next.js 14 App Router + React 18 + Tailwind CSS + Radix UI + Lucide Icons + Stream SDK │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                   Client Requests
                                          │
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                                   SERVER LAYER                                         │
│ Clerk Auth (middleware.ts) + Server Actions (actions/) + Supabase Server Client        │
└───────────────────┬─────────────────────────────────────────────────┬──────────────────┘
                    │                                                 │
            Async Job Pipeline                                    DB Queries
                    │                                                 │
┌───────────────────▼────────────────────────┐    ┌───────────────────▼──────────────────┐
│           LOCAL AI SIDECAR                 │    │            DATABASE LAYER            │
│ Python FastAPI (sidecar/main.py :8765)     │    │ Supabase PostgreSQL (meetings,       │
│ Faster-Whisper + Pyannote Diarization      │    │ transcripts, summaries, action items)│
└───────────────────┬────────────────────────┘    └──────────────────────────────────────┘
                    │
             LLM Generation
                    │
┌───────────────────▼────────────────────────┐
│           OLLAMA LLM SERVICE               │
│ Ollama Local (http://127.0.0.1:11434)      │
│ qwen3:8b / llama3.2                        │
└────────────────────────────────────────────┘
```

- **Frontend Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Authentication:** [Clerk](https://clerk.com/) (`@clerk/nextjs`)
- **Real-Time Video:** [Stream Video React SDK](https://getstream.io/video/) (`@stream-io/video-react-sdk`)
- **Database:** [Supabase PostgreSQL](https://supabase.com/) (`@supabase/ssr`)
- **AI Microservice:** [FastAPI](https://fastapi.tiangolo.com/) + [faster-whisper](https://github.com/SYSTRAN/faster-whisper) + [pyannote.audio](https://github.com/pyannote/pyannote-audio)
- **AI Summarization:** [Ollama](https://ollama.com/) local inference (`llama3.2`, `qwen3:8b`)
- **UI & Styling:** Tailwind CSS + Radix UI primitives + Lucide Icons

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or later
- **Python** 3.10+ (for local AI sidecar)
- **Ollama** installed locally (optional, for local LLM inference)

---

### Installation & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/yoom.git
   cd YOOM
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   **.env Key Requirements:**
   ```env
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # Stream Video API
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
   STREAM_SECRET_KEY=your_stream_secret_key

   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Local AI Sidecar & Ollama Config
   YOOM_SIDECAR_URL=http://127.0.0.1:8765
   OLLAMA_HOST=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   ```

4. **Start the Python AI Sidecar (Optional for local transcription & diarization):**
   ```bash
   python -m venv .venv
   # On Windows: .venv\Scripts\pip install -r sidecar/requirements.txt
   # On Linux/macOS: .venv/bin/pip install -r sidecar/requirements.txt

   python sidecar/main.py
   ```

5. **Start the Next.js Development Server:**
   ```bash
   npm run dev
   ```

6. **Open the Application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs Next.js development server |
| `npm run build` | Compiles optimized production build |
| `npm run start` | Starts Next.js production server |
| `npm run lint` | Runs ESLint check across all files |
| `npx tsc --noEmit` | Runs TypeScript type checking |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
