# CLAUDE.md — AI Data Analyst frontend (starter template)

Persistent context for the AI agent working on this repository. Read first.

## What this is

A React 18 + Vite + TypeScript chat frontend for the AI Data Analyst
backend: login (WorkOS-backed, opaque sessions), a chat round-trip with a
90-second blocking request and engineered waiting UX, typed visual
renderers, and server-authoritative conversation history.

This is a **template the user characterizes**, not a finished product. As
shipped it is branded "AI Data Analyst" with a fictional example org (ACME
Analytics). Until the user says otherwise, assume the standing job is
adaptation: set `VITE_API_BASE_URL` in `.env` (from `.env.example`; never
commit `.env`), put their product name in `index.html`,
`src/pages/Login.tsx` and `src/components/Sidebar.tsx`, and set their
locale/currency in `src/components/visuals/format.ts`. The ordered build
path with validation gates lives in the Execution Knowledge portal
(https://ai-data-analyst-three-eta.vercel.app) — follow it when the user
is working through missions.

## Map

```
src/lib/config.ts        env — THROWS if VITE_API_BASE_URL missing (by design)
src/lib/api.ts           fetch layer; machine error codes; 90s abort on /chat
src/lib/session.ts       analyst_* localStorage keys; tri-format expiry parse
src/lib/messageContent.ts assistant envelope parse — never render raw JSON
src/lib/routeGuards.ts   pure redirect decisions (tested)
src/hooks/useAuth.tsx    context; boot-time session validation
src/hooks/useChat.ts     chat engine; retry NEVER duplicates the user bubble
src/components/visuals/  contract types + defensive renderers + format.ts
src/pages/               Login / ForgotPassword / ResetPassword / ChatPage
```

## Run / test

```bash
npm install
cp .env.example .env    # set VITE_API_BASE_URL (no fallback exists — on purpose)
npm test                # vitest
npm run dev
```

## Hard rules

- **Never add URL fallbacks.** A missing env var must fail loudly at boot —
  the source system silently fell back to a production URL; that class of
  bug is banned here.
- **Never commit `.env`.**
- **Formatting comes from the contract** (`value_format` per visual/column),
  never from column-name pattern matching.
- **Renderers never crash on model output** — malformed payloads render
  nothing; keep the shape validation in VisualRenderer.
- **Retry reuses the failed question without re-appending the user bubble**
  — the invariant is tested; keep the test green.
- Typewriter runs only for new messages; history renders instantly; visuals
  and suggestion chips mount after typing completes (staged reveal).
- 16px minimum font-size on inputs (iOS zoom); `100dvh` not `100vh`.
