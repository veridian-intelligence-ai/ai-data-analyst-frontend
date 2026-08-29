# AI Data Analyst — App starter template

A template for building **your own AI Data Analyst frontend** — not a
finished product. React 18 + Vite + TypeScript chat UI for the
[AI Data Analyst backend template](https://github.com/veridian-intelligence-ai/ai-data-analyst-backend):
users sign in, ask questions about their data in plain English, and get
answers as markdown text, KPI cards, bar/line/grouped-bar charts, and detail
tables. The fictional example org used throughout the docs is
**ACME Analytics** — replacing it with your own product is the point.

## Get your own copy

Press **Use this template → Create a new repository** at the top of this
repo's GitHub page (do **not** fork — a fork drags along the upstream link;
the template button gives you a clean, single-commit repo of your own).
Then clone your new repo and work there.

## Quickstart

```bash
npm install

# Point the app at your backend — REQUIRED, there is no default.
cp .env.example .env
# edit .env: VITE_API_BASE_URL=http://localhost:8000

npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run typecheck  # tsc -b --noEmit
npm test           # vitest (jsdom)
npm run build      # production bundle in dist/
```

Deploying to a static host: `vercel.json` ships the one rewrite an SPA needs
(every path → `index.html`) so deep links like `/reset-password?token=…` work.

## Make it yours (what to tell your AI agent)

1. **Configure `.env`** from `.env.example` — set `VITE_API_BASE_URL` to your
   backend. There is deliberately no fallback: a missing value fails loudly
   at boot (`src/lib/config.ts`).
2. **Set your product name and branding** — the app title in `index.html`,
   the login header in `src/pages/Login.tsx`, and the sidebar product name in
   `src/components/Sidebar.tsx`. Search the repo for `ACME` and replace every
   reference with your own product/org.
3. **Match your locale and currency** — `src/components/visuals/format.ts`
   takes a locale and currency for number formatting (the example org trades
   in EUR); adjust to yours.
4. **Keep the contracts.** The assistant envelope
   (`src/lib/messageContent.ts`) and the typed visual payloads
   (`src/components/visuals/types.ts`) mirror the backend — change them in
   both places or not at all.

## Layout

```
src/
  lib/          config, session storage, API client, envelope parser, route guards
  hooks/        useAuth (context), useChat (messages, retry, conversations)
  pages/        Login, ForgotPassword, ResetPassword, ChatPage
  components/   Sidebar, ChatArea, ChatMessage, ChatInput
    visuals/    contract types + renderer + KPI/chart/table blocks + formatting
  test/         vitest suites (route guards, envelope, formatting, retry invariant)
```

The inline comments mark the production lessons each area encodes — missions
reference them directly, so keep them intact when refactoring.

## Where the real instructions live

This README gets you a running copy. The **ordered build path** — which seam
to open in which order, the validation gates that prove each step, and the
failure-recovery playbooks — lives in the Execution Knowledge portal's
AI Data Analyst project: <https://ai-data-analyst-three-eta.vercel.app>.
The companion backend template is
[ai-data-analyst-backend](https://github.com/veridian-intelligence-ai/ai-data-analyst-backend).
