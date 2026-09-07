# YOOM — Text-to-Speech, Meeting Summaries, UI/UX Redesign & Parallel Agents Plan

## Executive Summary

This plan adds three major feature sets to YOOM: (1) Text-to-Speech playback of meeting summaries, (2) A full meeting summary view with export/download capabilities, (3) A modern UI/UX redesign across the entire application, and (4) A parallel agent architecture for concurrent task execution. The plan is structured into 5 independent workstreams that can be executed in parallel using subagents.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    YOOM Application                      │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   TTS    │ Summary  │   UI/UX  │  Agent   │  Download   │
│  Engine  │ Pipeline │ Redesign │ System   │  Manager    │
└──────────┴──────────┴──────────┴──────────┴─────────────┘
```

### Technology Decisions

| Feature | Technology | Rationale |
|---------|-----------|-----------|
| TTS | Web Speech API (primary) + OpenAI TTS (fallback) | Free, no server load, browser-native |
| Summary Storage | Supabase (already configured) | Existing infrastructure, RLS enabled |
| PDF Export | `@react-pdf/renderer` or `html2canvas` + `jspdf` | Client-side, no server needed |
| UI Framework | Tailwind CSS + shadcn/ui (existing) | Stay consistent with current stack |
| Animations | `framer-motion` + `tailwindcss-animate` | Smooth, performant transitions |
| Agent System | Custom event-driven dispatch using `Promise.allSettled` | Lightweight, no external deps |

---

## File Structure (New & Modified)

### New Files to Create
```
lib/
├── tts/
│   ├── index.ts                    # TTS orchestrator
│   ├── web-speech.ts               # Web Speech API provider
│   └── openai-tts.ts               # OpenAI TTS fallback provider
├── download/
│   ├── index.ts                    # Download orchestrator
│   ├── pdf.ts                      # PDF generation
│   └── markdown.ts                 # Markdown export
├── agents/
│   ├── index.ts                    # Agent dispatcher
│   ├── transcription-agent.ts      # Transcription processing agent
│   ├── summarization-agent.ts      # Summarization agent
│   ├── tts-agent.ts                # TTS generation agent
│   └── export-agent.ts             # Export/download agent
components/
├── SummaryView.tsx                 # Main summary display component
├── TTSPlayer.tsx                   # Text-to-speech player UI
├── SummaryCard.tsx                 # Summary card for list views
├── ExportMenu.tsx                  # Export/download dropdown
├── AgentStatus.tsx                 # Agent task status indicator
├── ui/
│   ├── progress.tsx                # Progress bar component
│   ├── skeleton.tsx                # Loading skeleton
│   └── badge.tsx                   # Status badge
app/
├── (root)/
│   └── summary/
│       └── [meetingId]/
│           └── page.tsx            # Meeting summary page
actions/
├── tts.actions.ts                  # TTS server actions
├── download.actions.ts             # Download server actions
```

### Files to Modify
```
components/
├── MeetingRoom.tsx                 # Add summary button
├── MeetingCard.tsx                 # Add "View Summary" action
├── CallList.tsx                    # Show summary status
├── MeetingTypeList.tsx             # Modern redesign
├── HomeCard.tsx                    # Modern card design
├── Sidebar.tsx                     # Modern sidebar
├── Navbar.tsx                      # Modern navbar
├── MobileNav.tsx                   # Mobile nav redesign
├── MeetingSetup.tsx                # Pre-join redesign
app/
├── globals.css                     # Add new utilities
├── layout.tsx                      # Root layout tweaks
├── (root)/(home)/page.tsx          # Dashboard redesign
tailwind.config.ts                  # Extended design tokens
constants/index.ts                  # New nav links
package.json                        # New dependencies
```

---

## Workstream 1: Text-to-Speech Engine

### W1.1 — TTS Provider Abstraction
**Files:** `lib/tts/provider.ts`, `lib/tts/index.ts`

```typescript
// lib/tts/provider.ts
export interface TTSProvider {
  name: string;
  speak(text: string, options?: TTSOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSpeaking(): boolean;
  setRate(rate: number): void;
  setVoice(voice: SpeechSynthesisVoice): void;
  getVoices(): SpeechSynthesisVoice[];
}

export interface TTSOptions {
  rate?: number;      // 0.1 to 10, default 1
  pitch?: number;     // 0 to 2, default 1
  volume?: number;    // 0 to 1, default 1
  lang?: string;      // e.g., 'en-US'
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}
```

### W1.2 — Web Speech API Implementation
**File:** `lib/tts/web-speech.ts`

- Use `window.speechSynthesis` API
- Implement chunking for long text (>32k characters)
- Track speaking state via `SpeechSynthesisUtterance` events
- Expose voice selection and playback controls

### W1.3 — OpenAI TTS Fallback
**File:** `lib/tts/openai-tts.ts`

- Call OpenAI `/v1/audio/speech` endpoint
- Stream audio back via `HTMLAudioElement`
- Use `gpt-4o-mini-tts` model with `nova` voice (natural, clear)
- Return audio blob for caching

### W1.4 — TTS Player Component
**Files:** `components/TTSPlayer.tsx`, `components/ui/progress.tsx`

```typescript
interface TTSPlayerProps {
  text: string;
  title?: string;
  className?: string;
}
```

Features:
- Play/pause/stop controls with animated icons
- Speed selector (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Voice selector dropdown
- Progress bar showing current position
- Estimated time remaining display
- Waveform visualization (CSS-based animation)

### W1.5 — TTS Server Action
**File:** `actions/tts.actions.ts`

- `synthesizeSummaryAction(meetingId)` — fetches summary text, returns it for TTS
- `getAvailableVoicesAction()` — returns available browser voices
- Caches synthesized audio in Supabase Storage for OpenAI TTS

---

## Workstream 2: Meeting Summary Pipeline

### W2.1 — Summary Data Access Layer (enhance existing)
**File:** `lib/supabase/summaries.ts`

- Add `getSummaryByMeetingId()` — fetch full summary with action items, decisions, questions
- Add `getAllSummariesForUser(userId)` — paginated list of all summaries
- Add `updateActionItemStatus(id, status)` — toggle action item completion
- Add `deleteSummary(id)` — soft delete

### W2.2 — Summary View Component
**File:** `components/SummaryView.tsx`

```typescript
interface SummaryViewProps {
  meetingId: string;
  summary: MeetingSummaryResult;
  transcript?: TranscriptSegmentRecord[];
}
```

Sections:
1. **Overview** — Full meeting summary text with TTS player embedded
2. **Action Items** — Interactive checklist with assignees, completion toggle
3. **Decisions** — Highlighted cards with context quotes
4. **Open Questions** — Yellow-accented cards
5. **Transcript** — Collapsible, searchable full transcript
6. **Metadata** — Date, duration, participants, model used

### W2.3 — Meeting Summary Page
**File:** `app/(root)/summary/[meetingId]/page.tsx`

- Server component that fetches summary from Supabase
- Redirects to meeting page if no summary exists
- Shows "Generating Summary..." state with progress
- Loads `SummaryView` with full data

### W2.4 — Summary Trigger (Post-Meeting)
**File:** `components/MeetingRoom.tsx` (modification)

- On call end, show modal: "Generate Meeting Summary?"
- If yes, call `generateSummaryAction(meetingId)`
- Show real-time progress via polling
- Redirect to summary page on completion

### W2.5 — Summary Card for Lists
**File:** `components/SummaryCard.tsx`

- Compact card showing summary status, date, action item count
- Click to navigate to full summary page
- TTS quick-play button on hover

---

## Workstream 3: Download & Export Manager

### W3.1 — PDF Export
**File:** `lib/download/pdf.ts`

```typescript
export async function exportSummaryAsPDF(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date
): Promise<Blob> {
  // Use @react-pdf/renderer to create styled PDF
  // Include: header, overview, action items table, decisions, questions
  // Professional layout with YOOM branding
}
```

Design:
- A4 page format
- YOOM logo in header
- Section headers with blue accent color
- Action items as a table with status column
- Clean typography, proper spacing

### W3.2 — Markdown Export
**File:** `lib/download/markdown.ts`

```typescript
export function exportSummaryAsMarkdown(
  summary: MeetingSummaryResult,
  meetingTitle: string,
  meetingDate: Date
): string {
  // Generate clean markdown with:
  // # Meeting Summary: {title}
  // ## Date: {date}
  // ## Overview
  // ## Action Items
  // ## Decisions
  // ## Open Questions
}
```

### W3.3 — Export Menu Component
**File:** `components/ExportMenu.tsx`

```typescript
interface ExportMenuProps {
  summary: MeetingSummaryResult;
  meetingTitle: string;
  meetingDate: Date;
  onExport?: (format: ExportFormat) => void;
}

type ExportFormat = 'pdf' | 'markdown' | 'json' | 'text';
```

Dropdown menu with:
- PDF Download (icon: FileText)
- Markdown Download (icon: Code)
- JSON Download (icon: Braces)
- Plain Text Download (icon: File)
- Copy to Clipboard (icon: Copy)

### W3.4 — Download Hook
**File:** `hooks/useExport.ts`

```typescript
export function useExport() {
  const exportAs = async (format: ExportFormat, summary: MeetingSummaryResult, title: string) => {
    // Handle blob creation, download trigger, clipboard copy
    // Return loading state and error handling
  };

  return { exportAs, isExporting, lastError };
}
```

---

## Workstream 4: Modern UI/UX Redesign

### W4.1 — Design Token System
**File:** `tailwind.config.ts`

```typescript
const config = {
  theme: {
    extend: {
      colors: {
        // Refined dark palette
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#1C1F2E',  // primary bg
          300: '#161925',  // deeper bg
          400: '#252A41',  // card bg
          500: '#2D3348',  // hover state
          600: '#1E2757',  // accent bg
          700: '#0f1219',  // darkest
        },
        accent: {
          blue: '#0E78F9',
          orange: '#FF742E',
          purple: '#830EF9',
          yellow: '#F9A90E',
          green: '#10B981',
          red: '#EF4444',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#C9DDFF',
          tertiary: '#8892B0',
          muted: '#5A6178',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(14, 120, 249, 0.3)',
        'glow-purple': '0 0 20px rgba(131, 14, 249, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        wave: { '0%, 100%': { transform: 'scaleY(0.5)' }, '50%': { transform: 'scaleY(1.2)' } },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

### W4.2 — Global CSS Enhancements
**File:** `app/globals.css`

```css
/* Modern scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #252A41; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #0E78F9; }

/* Glass morphism v2 */
.glassmorphism {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Gradient text utility */
.gradient-text {
  background: linear-gradient(135deg, #0E78F9, #830EF9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Subtle hover glow */
.hover-glow {
  transition: box-shadow 0.3s ease;
}
.hover-glow:hover {
  box-shadow: 0 0 24px rgba(14, 120, 249, 0.2);
}
```

### W4.3 — Modern Sidebar
**File:** `components/Sidebar.tsx`

Changes:
- Rounded navigation items with active state glow
- User avatar at bottom with subtle gradient border
- Collapsible to icon-only mode on medium screens
- Smooth transitions between states
- Active indicator: left border accent + background highlight

### W4.4 — Modern Navbar
**File:** `components/Navbar.tsx`

Changes:
- Glassmorphism background
- Search bar placeholder (for future meetings search)
- Notification bell with badge
- User button with dropdown menu
- Subtle bottom border with gradient fade

### W4.5 — Modern Home Cards
**File:** `components/HomeCard.tsx`

Changes:
- Gradient backgrounds instead of flat colors
- Icon container with subtle glow on hover
- Smooth scale transform on hover (1.02)
- Staggered entrance animation
- Description text with proper line height

### W4.6 — Modern Dashboard
**File:** `app/(root)/(home)/page.tsx`

Changes:
- Animated greeting based on time of day
- Quick stats row (upcoming meetings, action items due)
- Recently viewed summaries carousel
- Improved hero section with animated background

### W4.7 — Modern Meeting Setup
**File:** `components/MeetingSetup.tsx`

Changes:
- Centered card with glassmorphism
- Larger video preview with rounded corners
- Toggle switches instead of checkboxes
- Animated join button with gradient
- Device selector as styled dropdowns

### W4.8 — Modern Meeting Room
**File:** `components/MeetingRoom.tsx`

Changes:
- Floating bottom bar with glassmorphism
- Rounded control buttons with hover states
- Animated panel transitions
- Summary button added to controls
- TTS quick-play in participant panel

---

## Workstream 5: Parallel Agent System

### W5.1 — Agent Dispatcher
**File:** `lib/agents/dispatcher.ts`

```typescript
export interface AgentTask<TInput, TOutput> {
  id: string;
  name: string;
  execute(input: TInput): Promise<TOutput>;
  timeout?: number; // ms, default 30000
}

export interface AgentResult<T> {
  taskId: string;
  status: 'success' | 'error' | 'timeout';
  data?: T;
  error?: string;
  duration: number;
}

export async function dispatchAgents<T extends Record<string, unknown>>(
  tasks: { [K in keyof T]: AgentTask<unknown, T[K]> },
  inputs: { [K in keyof T]: unknown }
): Promise<{ [K in keyof T]: AgentResult<T[K]> }> {
  // Execute all agents in parallel with Promise.allSettled
  // Handle timeouts per agent
  // Return results with status for each
}
```

### W5.2 — Post-Meeting Agent Pipeline
**File:** `lib/agents/pipeline.ts`

When a meeting ends, dispatch these agents in parallel:

```typescript
export async function handleMeetingEnd(meetingId: string) {
  const results = await dispatchAgents({
    transcription: {
      id: 'transcription',
      name: 'Transcription',
      execute: () => generateTranscription(meetingId),
      timeout: 120000,
    },
    summary: {
      id: 'summary',
      name: 'Summarization',
      execute: () => generateSummary(meetingId),
      timeout: 60000,
    },
    tts: {
      id: 'tts',
      name: 'TTS Generation',
      execute: () => generateTTSCache(meetingId),
      timeout: 30000,
    },
  }, {
    transcription: meetingId,
    summary: meetingId,
    tts: meetingId,
  });

  return results;
}
```

### W5.3 — Agent Status Component
**File:** `components/AgentStatus.tsx`

```typescript
interface AgentStatusProps {
  agents: Array<{
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    progress?: number;
  }>;
}
```

Visual:
- Vertical list of agent cards
- Each card shows: icon, name, status badge, progress bar
- Animated transitions between states
- "Generate Summary" button when all complete

### W5.4 — Server Actions for Agent Orchestration
**File:** `actions/agents.actions.ts`

```typescript
'use server';

export async function startPostMeetingPipeline(meetingId: string) {
  // 1. Verify user auth
  // 2. Check if pipeline already ran
  // 3. Dispatch agents
  // 4. Return initial status
}

export async function getAgentStatus(meetingId: string) {
  // Poll current status of all agents for this meeting
  // Returns: { transcription: status, summary: status, tts: status }
}
```

---

## Implementation Order (Parallel Execution Plan)

### Phase 1: Foundation (Week 1)
**Agent A — TTS Engine**
1. Create `lib/tts/provider.ts` interface
2. Implement `lib/tts/web-speech.ts`
3. Implement `lib/tts/openai-tts.ts`
4. Create `lib/tts/index.ts` orchestrator
5. Build `components/TTSPlayer.tsx`
6. Test with sample text

**Agent B — UI Foundation**
1. Update `tailwind.config.ts` with new design tokens
2. Update `app/globals.css` with new utilities
3. Create `components/ui/progress.tsx`
4. Create `components/ui/skeleton.tsx`
5. Create `components/ui/badge.tsx`
6. Test with existing pages

### Phase 2: Core Features (Week 2)
**Agent C — Summary Pipeline**
1. Enhance `lib/supabase/summaries.ts` data access
2. Create `components/SummaryView.tsx`
3. Create `components/SummaryCard.tsx`
4. Create `app/(root)/summary/[meetingId]/page.tsx`
5. Add summary trigger to `MeetingRoom.tsx`
6. Test end-to-end flow

**Agent D — Download Manager**
1. Install `@react-pdf/renderer` dependency
2. Create `lib/download/pdf.ts`
3. Create `lib/download/markdown.ts`
4. Create `hooks/useExport.ts`
5. Create `components/ExportMenu.tsx`
6. Test export to all formats

### Phase 3: Polish & Agents (Week 3)
**Agent E — UI/UX Redesign**
1. Redesign `components/Sidebar.tsx`
2. Redesign `components/Navbar.tsx`
3. Redesign `components/HomeCard.tsx`
4. Redesign `app/(root)/(home)/page.tsx`
5. Redesign `components/MeetingSetup.tsx`
6. Redesign `components/MeetingRoom.tsx`
7. Add animations throughout
8. Visual regression testing

**Agent F — Agent System**
1. Create `lib/agents/dispatcher.ts`
2. Create `lib/agents/pipeline.ts`
3. Create `actions/agents.actions.ts`
4. Create `components/AgentStatus.tsx`
5. Integrate with post-meeting flow
6. Test parallel execution

### Phase 4: Integration (Week 4)
1. Wire all workstreams together
2. End-to-end testing
3. Performance optimization
4. Accessibility audit
5. Documentation

---

## Dependencies to Install

```bash
npm install @react-pdf/renderer framer-motion
npm install -D @types/react-pdf
```

---

## Environment Variables to Add

```env
# TTS
OPENAI_API_KEY=sk-...          # For OpenAI TTS fallback
NEXT_PUBLIC_TTS_PROVIDER=web   # 'web' | 'openai'

# AI (already exists)
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

---

## Testing Strategy

1. **Unit Tests:**
   - TTS providers (mock `window.speechSynthesis`)
   - PDF generation (snapshot tests)
   - Markdown generation (string comparison)
   - Agent dispatcher (mock promises)

2. **Integration Tests:**
   - Summary creation flow (end-to-end)
   - Export flow (mock blob download)
   - TTS playback (mock audio)

3. **E2E Tests (Playwright):**
   - Complete meeting → summary → export flow
   - TTS player controls
   - UI responsive behavior
   - Agent status updates

---

## Success Criteria

- [ ] TTS plays meeting summaries with voice selection and speed control
- [ ] Summaries display with all sections (overview, action items, decisions, questions)
- [ ] Export works for PDF, Markdown, JSON, and plain text
- [ ] UI has modern, consistent design across all pages
- [ ] Agents execute in parallel with real-time status updates
- [ ] All existing functionality preserved (no regressions)
- [ ] Performance: Summary generation < 30s, TTS start < 2s, PDF export < 5s
- [ ] Accessibility: WCAG 2.1 AA compliant
