# YOOM — Project Status

_Snapshot taken: 2026-08-18_

## 1. Project Overview

**YOOM** is a Zoom-style video conferencing web app built with:

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | React 18 |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Auth | Clerk (`@clerk/nextjs`) |
| Video | Stream Video (`@stream-io/video-react-sdk` + `@stream-io/node-sdk`) |
| Database (declared) | Prisma + MySQL (`mysql2`) |
| Date utilities | `date-fns`, `react-datepicker` |
| Icons | `lucide-react` |

- Package name: `yoom` (v0.1.0, private)
- Scripts: `dev`, `dev:turbo`, `build`, `start`, `lint`

---

## 2. Git Status

```
Current branch: main
Main branch:    main
Git user:       Atharva G Ingale
```

### Recent commits
- `a383bbf` — Initial commit

### Working-tree changes (uncommitted)
```
 M .gitignore
 M package-lock.json
 M package.json
```

Only the three top-level config/lockfile files are dirty — no source-code changes have been committed since the initial commit. `node_modules`, `.next`, `.env*`, `.vscode`, `.clerk/`, `*.tsbuildinfo` and `next-env.d.ts` are correctly gitignored.

---

## 3. Project Structure (source files only)

```
YOOM/
├── actions/
│   └── stream.actions.ts          # Server action: Stream token provider
├── app/
│   ├── layout.tsx                 # Root layout (ClerkProvider + Toaster + Inter font)
│   ├── globals.css                # Tailwind base + custom utilities (bg-dark-2, etc.)
│   ├── (auth)/
│   │   ├── sign-in/[[...sigin-in]]/page.tsx   # ⚠ folder typo: "sigin-in"
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   └── (root)/
│       ├── layout.tsx             # Wraps children in <StreamVideoProvider>
│       ├── (home)/
│       │   ├── layout.tsx
│       │   ├── page.tsx           # Home dashboard
│       │   ├── personal-room/page.tsx
│       │   ├── upcoming/page.tsx
│       │   ├── previous/page.tsx
│       │   └── recordings/page.tsx
│       └── meeting/[id]/page.tsx  # Active meeting room
├── components/
│   ├── Alert.tsx
│   ├── CallList.tsx
│   ├── EndCallButton.tsx
│   ├── HomeCard.tsx
│   ├── Loader.tsx
│   ├── MeetingCard.tsx
│   ├── MeetingModal.tsx
│   ├── MeetingRoom.tsx
│   ├── MeetingSetup.tsx
│   ├── MeetingTypeList.tsx
│   ├── MobileNav.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── ui/                        # shadcn primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── popover.tsx
│       ├── sheet.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── constants/
│   └── index.ts                   # Meeting types, nav links, etc.
├── hooks/
│   ├── useGetCallById.ts
│   └── useGetCalls.ts
├── lib/
│   └── utils.ts                   # cn() = clsx + tailwind-merge
├── providers/
│   └── StreamClientProvider.tsx   # <StreamVideoClient> wrapper
├── public/
│   ├── icons/                     # SVG icons + yoom-logo.svg
│   └── images/                    # Avatars + hero-background.png
├── middleware.ts                  # Clerk route protection
├── next.config.mjs
├── postcss.config.js
├── components.json                # shadcn config
├── package.json
├── package-lock.json
└── README.md
```

---

## 4. Detected Issues / Observations

### 4.1 Critical / Likely runtime issues
1. **No Prisma schema or client singleton exists.**
   `package.json` lists `@prisma/client` and `prisma`, but there is **no `prisma/` directory**, no `schema.prisma`, no migrations, and no `lib/prisma.ts` client instance. Any code that imports from `@/lib/prisma` or expects a database will fail.
2. **Folder name typo: `[[...sigin-in]]`**
   `app/(auth)/sign-in/[[...sigin-in]]/page.tsx` — the catch-all segment is misspelled (`sigin-in` instead of `sign-in`). Clerk's catch-all convention expects the segment name to match the route. This will likely cause Clerk sign-in to render under an unexpected URL or not at all.
   - The URL path becomes `/sign-in/sigin-in/...` rather than `/sign-in/...`.
3. **Missing environment configuration.**
   No `.env`, `.env.example`, or `README` setup section is present in the repo (`.env*` are gitignored). Required env vars:
   - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - Stream: `NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_SECRET_KEY`
   - MySQL/Prisma: `DATABASE_URL`
   Without these, both `middleware.ts` (`ClerkProvider`) and `stream.actions.ts` (`tokenProvider`) will throw at runtime.
4. **`StreamVideoProvider` throws on missing API key at the React effect level.**
   `providers/StreamClientProvider.tsx:18` throws inside `useEffect` when `API_KEY` is undefined. This will surface as an uncaught client error rather than a graceful fallback.

### 4.2 Lint / TypeScript concerns
5. **`middleware.ts` regex matcher is loose.**
   The `publicPaths` array uses `RegExp.test` with `^...$` anchors that don't account for path segments after the matched prefix (e.g., `/sign-in/foo` will not match `/sign-in(.*)` because of the `$` anchor). The Clerk middleware convention typically relies on Clerk's own `auth.protect()` or a more permissive regex. As written, only exact-path matches pass through; everything else falls through to `NextResponse.next()` without Clerk's auth evaluation, which means Clerk's default protection is effectively **not applied** to protected routes — anyone can reach `/upcoming`, `/meeting/[id]`, etc.
6. **`middleware.ts` matcher pattern typo / over-broad.**
   `'/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'` is mostly fine, but combined with the public-paths logic above, route protection is essentially a no-op.

### 4.3 Stylistic / minor
7. **`app/layout.tsx` body uses `bg-dark-2`** — relies on a custom Tailwind utility / plugin; ensure it is defined in `tailwind.config.ts` (not shown).
8. **`react-datepicker` CSS is imported globally** (`app/layout.tsx:7`) — fine, but verify `bg-dark-2` styles override it for dark mode.
9. **No `app/(root)/meeting/[id]/page.tsx` server-side guards** — meeting route relies entirely on Clerk's middleware redirect (which, per #5, is currently disabled).
10. **No tests, no CI config, no Dockerfile, no `.env.example`.**

---

## 5. Relevant Configuration Summary

### `package.json` scripts
```json
{
  "dev":       "next dev",
  "dev:turbo": "next dev --turbo",
  "build":     "next build",
  "start":     "next start",
  "lint":      "next lint"
}
```

### `middleware.ts` (excerpt)
```ts
import { clerkMiddleware } from '@clerk/nextjs/server';
export default clerkMiddleware((auth, req) => {
  const publicPaths = ['/', '/sign-in(.*)', '/sign-up(.*)', '/api(.*)', '/_next(.*)',
    '/(assets|fonts|images)(.*)', '.*\\.(ico|svg|png|jpg|jpeg|gif|webp)$'];
  const isPublic = publicPaths.some(p => new RegExp(`^${p}$`).test(req.nextUrl.pathname));
  return isPublic ? NextResponse.next() : NextResponse.next();   // ⚠ no-op for protected routes
});
```

### Required environment variables (not committed)
| Var | Used by |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `ClerkProvider` |
| `CLERK_SECRET_KEY` | `clerkMiddleware`, server actions |
| `NEXT_PUBLIC_STREAM_API_KEY` | `StreamVideoProvider`, `stream.actions.ts` |
| `STREAM_SECRET_KEY` | `stream.actions.ts` (`tokenProvider`) |
| `DATABASE_URL` | Prisma (when added) |

### Gitignore highlights
- `node_modules`, `.next`, `.out`, `build`, `coverage`
- `.env`, `.env*.local`
- `*.tsbuildinfo`, `next-env.d.ts`
- `.vscode`, `.vercel`, `/.clerk/`

---

## 6. Recommended Next Steps (priority order)

1. **Fix `app/(auth)/sign-in/[[...sigin-in]]/page.tsx`** — rename the catch-all segment to `[[...sign-in]]`.
2. **Add Clerk `auth.protect()`** in `middleware.ts` for all non-public routes (replace the no-op `NextResponse.next()` for protected paths).
3. **Add a Prisma schema + client singleton** (`prisma/schema.prisma`, `lib/prisma.ts`) if a DB is actually intended.
4. **Add `.env.example`** documenting Clerk + Stream + DB variables.
5. **Graceful error handling** in `StreamVideoProvider` for missing `API_KEY`.
6. **Confirm `tailwind.config.ts`** defines `bg-dark-2` and other custom utilities used in `globals.css`.
7. **Commit pending changes** to `.gitignore`, `package.json`, `package-lock.json` once verified.

---

_Generated from a read-only inspection. No source files were modified._

---

## 7. How It Works — End-to-End Walkthrough

### 7.1 What YOOM is, in one paragraph

YOOM is a Zoom-style real-time video conferencing app. Users sign in with Clerk, then either **create / join / schedule / record** a Stream-powered meeting from a four-card dashboard. Meetings live entirely on **GetStream's video infrastructure** (no media ever touches YOOM's servers); YOOM just issues auth tokens, lists prior/upcoming calls, and renders Stream's pre-built video UI components.

### 7.2 Authentication & routing (Clerk)

1. **`middleware.ts`** runs `clerkMiddleware()` on every request.
   - A hand-written `publicPaths` regex list marks `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api(.*)`, static assets, and image files as public.
   - For all other routes the middleware currently calls `NextResponse.next()` without invoking Clerk's `auth.protect()` — meaning Clerk does not redirect unauthenticated users. (See issue #5 in §4.)
2. **`app/layout.tsx`** wraps the entire app in `<ClerkProvider>` with custom dark-theme appearance variables (`colorPrimary: '#0E78F9'`, `colorBackground: '#1C1F2E'`).
3. **`app/(auth)/sign-in/[[...sigin-in]]/page.tsx`** renders Clerk's catch-all `<SignIn />`. (Folder typo `sigin-in` is the only thing matching this catch-all — the actual URL becomes `/sign-in/sigin-in/...`.)
4. **`app/(auth)/sign-up/[[...sign-up]]/page.tsx`** renders Clerk's `<SignUp />` analogously.
5. After sign-in, users land inside the `(root)` route group, which has its own **`app/(root)/layout.tsx`** that mounts `<StreamVideoProvider>` — so only authenticated pages get the Stream SDK.

### 7.3 The Stream video client (server + client)

#### Server side — `actions/stream.actions.ts`
```ts
'use server';
export const tokenProvider = async () => {
  const user = await currentUser();
  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_SECRET);
  return streamClient.createToken(user.id, expirationTime, issuedAt);
};
```
- Called from React Server Actions.
- Authenticates the request via Clerk's `currentUser()` (so it only works inside Clerk-protected contexts).
- Returns a **short-lived JWT** (1 hour expiry, issued 60 s in the past to allow clock skew).
- Throws if any of: no user, missing API key, missing secret.

#### Client side — `providers/StreamClientProvider.tsx`
- Reads the Clerk user via `useUser()`.
- Constructs a `StreamVideoClient` with `{ apiKey, user: { id, name, imageUrl }, tokenProvider }`.
- Wraps children in `<StreamVideo client={...}>` so any nested component can call `useStreamVideoClient()`.
- Renders a `<Loader />` until the client is ready.

### 7.4 The home dashboard

**`app/(root)/(home)/page.tsx`** → renders `MeetingTypeList` (the four-card grid).

`MeetingTypeList.tsx` exposes four actions via `HomeCard`:

| Card | Icon | Behaviour |
|---|---|---|
| **New Meeting** | `add-meeting.svg` | Opens `isInstantMeeting` modal → calls `createMeeting()` → immediately `router.push('/meeting/<id>')` |
| **Join Meeting** | `join-meeting.svg` | Opens modal with `<Input>` for a link → `router.push(values.link)` |
| **Schedule Meeting** | `schedule.svg` | Opens modal with `<Textarea>` (description) + `<ReactDatePicker>` → `createMeeting()` with `starts_at` set → on success, modal swaps to "Copy Meeting Link" |
| **View Recordings** | `recordings.svg` | `router.push('/recordings')` |

`createMeeting()` internals:
1. `crypto.randomUUID()` → call ID.
2. `client.call('default', id)` → Stream call instance.
3. `call.getOrCreate({ data: { starts_at, custom: { description } } })` — creates it on Stream if it doesn't exist.
4. If scheduled (with a description), shows the copy-link modal; if instant, navigates straight into the meeting.

### 7.5 The meeting room (live call)

`app/(root)/meeting/[id]/page.tsx` is the orchestration page:

1. Reads `:id` from URL params.
2. Loads the call via `useGetCallById(id)` (a hook that calls `client.queryCalls({ filter_conditions: { id } })`).
3. Enforces access — if the call type is `'invited'` and the current Clerk user is not in `call.state.members`, shows an `<Alert title="You are not allowed to join this meeting" />`.
4. Checks `starts_at` and `ended_at` and either:
   - Renders `<MeetingSetup />` (mic/cam preview) until the user clicks **Join**, or
   - Renders `<MeetingRoom />` once joined.

#### `MeetingSetup.tsx` (pre-call screen)
- Shows `<VideoPreview />` (Stream's own component).
- Lets user toggle "Join with mic and camera off" — this calls `call.camera.disable()` / `call.microphone.disable()`.
- Shows `<DeviceSettings />` for choosing camera/mic.
- On **Join meeting** click → `call.join()` → `setIsSetupComplete(true)`.
- If the call hasn't started yet (`startsAt > now`) → shows an Alert with the scheduled time.
- If the call has been ended by the host → shows "The call has been ended by the host".

#### `MeetingRoom.tsx` (in-call screen)
- Three layout modes via `<DropdownMenu>`:
  - **Grid** → `<PaginatedGridLayout />`
  - **Speaker-Left / Speaker-Right** → `<SpeakerLayout participantsBarPosition="right|left" />`
- `<CallControls onLeave={() => router.push('/')} />` — built-in mic/cam/screen-share/leave buttons.
- `<CallStatsButton />` — bandwidth stats.
- `<Users />` icon toggles `<CallParticipantsList />` on the right.
- `<EndCallButton />` — kicks the user and ends the call (hidden for `?personal=true`).
- Shows `<Loader />` until `callingState === CallingState.JOINED`.

### 7.6 History pages (calls list)

`useGetCalls` hook:
1. Calls `client.queryCalls({ sort: starts_at desc, filter_conditions: { starts_at exists, OR(creator==me, members includes me) } })`.
2. Splits the result into:
   - **endedCalls** — `startsAt < now` or has `endedAt`
   - **upcomingCalls** — `startsAt > now`
3. Also returns the full `callRecordings` set (used by the Recordings page).

`CallList` component renders one of the three buckets based on a `type` prop:
- `type="ended"` → renders ended calls.
- `type="upcoming"` → renders upcoming calls.
- `type="recordings"` → fetches each call's `queryRecordings()` and flattens.

Each item becomes a `<MeetingCard>` showing description, date, and an icon-button to either:
- **Start** — `router.push('/meeting/<id>')`, or
- **Play** (recordings) — `router.push(<recording_url>)`.

### 7.7 Personal Room

`app/(root)/(home)/personal-room/page.tsx`:
- The Clerk user's ID **is** the meeting ID (so the link is stable across sessions).
- `useGetCallById(user.id)` checks whether the personal call already exists.
- On **Start Meeting**, `client.call('default', user.id).getOrCreate({ data: { starts_at: now } })` (only if it doesn't already exist) → `router.push('/meeting/<id>?personal=true')`.
- The `?personal=true` flag is read in `MeetingRoom` to hide the `<EndCallButton />` (a personal room shouldn't be terminated).
- The page also offers a **Copy Invitation** button using `navigator.clipboard.writeText()` + a toast.

### 7.8 Cross-cutting UX pieces

- **`<Navbar />`** — top bar (avatar, sign-out).
- **`<Sidebar />`** — fixed left nav (Home, Upcoming, Previous, Recordings, Personal Room) using `sidebarLinks` from `constants/index.ts`.
- **`<MobileNav />`** — responsive drawer using shadcn `<Sheet />`.
- **`<Loader />`** — full-screen spinner shown during every async load.
- **`<Alert />`** — coloured info banner used for "meeting not started", "call not found", "not allowed", etc.
- **`<Toaster />`** — global Radix toast notifications, mounted in `app/layout.tsx`.
- **`<MeetingModal />`** — generic modal that wraps shadcn `<Dialog>`, used for New / Join / Schedule flows.
- **Custom Tailwind palette** — `bg-dark-2`, `bg-blue-1`, `bg-purple-1`, `bg-yellow-1`, `text-sky-1`, `text-sky-2`, `bg-dark-3` — defined in `tailwind.config.ts` (not shown in listing).

### 7.9 Data flow diagram

```
 Browser
   │
   ├── Clerk ──► sign-in/sign-up UI ──► session cookie
   │                                       │
   │   (ClerkProvider in app/layout.tsx)   │
   │                                       ▼
   │                          app/(root)/layout.tsx
   │                                       │
   │                                       ▼
   │                          <StreamVideoProvider>
   │                                       │
   │   ┌──────────────────┬─────────────────┼──────────────────┐
   │   ▼                  ▼                 ▼                  ▼
   │ (home) page    meeting/[id] page   upcoming/previous/   personal-room
   │ (4 cards)      (MeetingSetup →     recordings pages     page
   │                MeetingRoom)        (CallList)
   │   │                  │                  │
   │   │   useStreamVideoClient()            │
   │   └────────► Stream Video SDK ──────────┘
   │                  │
   │                  │ tokenProvider()
   │                  ▼
   │           actions/stream.actions.ts
   │           (server action)
   │                  │
   │                  ▼
   │           StreamClient (Node SDK)
   │           + Clerk currentUser()
   │                  │
   │                  ▼
   │           GetStream API  (calls, recordings, tokens)
   │
   └── All real-time audio/video flows peer-to-peer via GetStream's
       global edge network. YOOM's server only sees metadata
       (call ID, starts_at, custom description, members).
```

### 7.10 Environment variables (referenced but not committed)

| Variable | Where it's used | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `ClerkProvider` | Clerk browser SDK |
| `CLERK_SECRET_KEY` | `clerkMiddleware`, `currentUser()` | Clerk server SDK |
| `NEXT_PUBLIC_STREAM_API_KEY` | `StreamClientProvider`, `StreamClient` | Stream SDK |
| `STREAM_SECRET_KEY` | `stream.actions.ts` | Stream token signing |
| `NEXT_PUBLIC_BASE_URL` | `MeetingTypeList`, `CallList`, `PersonalRoom` | Build absolute meeting links |
| `DATABASE_URL` | (intended for Prisma) | MySQL DSN — **not yet wired up** |

### 7.11 What's intentionally NOT in this app

- **No video is stored on YOOM's servers.** All media is handled by GetStream; the `react-datepicker`, `mysql2`, and Prisma deps suggest a future "scheduled meetings persisted to MySQL" feature, but no code does that today.
- **No backend API routes** — everything is App Router pages + server actions.
- **No tests / CI** — `package.json` has no test script and no GitHub Actions.
- **No DB persistence layer for calls** — meeting metadata lives entirely on Stream. The MySQL/Prisma deps look like a placeholder for future features (e.g., user profiles, scheduled-meeting reminders, billing).

### 7.12 Mental model — what each file "owns"

| Concern | File |
|---|---|
| Root layout, fonts, theme, Clerk | `app/layout.tsx` |
| Auth pages | `app/(auth)/sign-in/...`, `app/(auth)/sign-up/...` |
| Stream SDK wrapping | `providers/StreamClientProvider.tsx` |
| Stream server token | `actions/stream.actions.ts` |
| Middleware (route protection) | `middleware.ts` |
| Home dashboard cards | `components/MeetingTypeList.tsx` + `HomeCard.tsx` |
| Schedule/Join modal | `components/MeetingModal.tsx` + `MeetingTypeList.tsx` |
| Pre-call device setup | `components/MeetingSetup.tsx` |
| In-call UI | `components/MeetingRoom.tsx` + `EndCallButton.tsx` |
| Listing calls | `components/CallList.tsx` + `MeetingCard.tsx` |
| Personal room | `app/(root)/(home)/personal-room/page.tsx` |
| Active meeting routing | `app/(root)/meeting/[id]/page.tsx` |
| Stream query (calls) | `hooks/useGetCalls.ts` |
| Stream query (single call) | `hooks/useGetCallById.ts` |
| Navigation config | `constants/index.ts` |
| `cn()` helper | `lib/utils.ts` |
| Icons | `public/icons/*.svg` |
| Avatar / hero images | `public/images/*` |
