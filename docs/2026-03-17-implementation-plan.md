## Plan: ChatBox — Next.js + Supabase + OpenRouter Web App

**TL;DR**: Build a ChatGPT-like web app from the empty repo. A Next.js 15 App Router project with Supabase auth + DB, streaming AI chat via OpenRouter (using the Vercel AI SDK), a collapsible tools panel, model selector, and a persistent session sidebar.

---

### Phase 1 — Project Bootstrap
1. Scaffold with `create-next-app` (TypeScript, Tailwind, App Router, `src/` dir)
2. Install: `@supabase/ssr`, `@supabase/supabase-js`, `ai`, `@ai-sdk/openai`, `zod`, `mathjs`, `next-themes`, `lucide-react`, `clsx`, `tailwind-merge`
3. Create `.env.local` with all required env var placeholders

### Phase 2 — Supabase Setup
4. SQL migration for `chat_sessions` table (id, user_id, title, model, tools_enabled[], timestamps)
5. SQL migration for `messages` table (id, session_id, role, content JSONB, created_at)
6. Row Level Security policies — users can only access their own rows in both tables

### Phase 3 — Auth
7. `src/lib/supabase/client.ts` + `server.ts` — browser and server Supabase clients
8. `src/middleware.ts` — protects all `/(app)` routes, refreshes Supabase session on every request
9. src/app/(auth)/login/page.tsx/login/page.tsx) — login form
10. src/app/(auth)/register/page.tsx/register/page.tsx) — registration form
11. Auth callback route for email confirmation links

### Phase 4 — App Shell & Session Management
12. `src/app/(app)/layout.tsx` — AppShell with sidebar + ThemeProvider *(depends on 3)*
13. `src/components/layout/Sidebar.tsx` — session list, "New Chat" button, sign out, theme toggle
14. `src/lib/db/sessions.ts` + `messages.ts` — typed DB helpers for all CRUD operations
15. Chat routes: `/chat` (new empty chat) and `/chat/[sessionId]` (load existing session)

### Phase 5 — Tools (server-side only)
16. `calculator.ts` — math via `mathjs.evaluate()` (sandboxed, not arbitrary JS)
17. `weather.ts` — Open-Meteo API (no key needed; geocode city → fetch weather)
19. `wikipedia.ts` — Wikipedia REST API search + article summary
20. `urlReader.ts` — fetch & extract text from a URL (with SSRF protection: blocks private IPs/localhost)
21. `src/lib/ai/models.ts` — curated model list for the selector
22. `src/lib/ai/openrouter.ts` — `@ai-sdk/openai` provider with OpenRouter base URL

### Phase 6 — Chat API
23. `src/app/api/chat/route.ts` — POST, streaming:
    - Receives `{ messages, sessionId, model, enabledTools }`
    - Saves user message to DB; upserts session if new
    - Calls Vercel AI SDK `streamText` with **only the enabled tools** registered, `maxSteps: 5`
    - `onFinish` callback saves assistant message to DB; auto-titles new sessions from first message
    - Returns `result.toDataStreamResponse()`

### Phase 7 — Chat UI
24. `ChatWindow.tsx` — orchestrator using `useChat` hook from Vercel AI SDK
25. `MessageList.tsx` + `MessageItem.tsx` — auto-scroll list, markdown rendering for assistant messages
26. `ToolCallDisplay.tsx` — inline tool invocation + result cards inside the message stream
27. `ChatInput.tsx` — auto-resize textarea, Enter to send / Shift+Enter for newline
28. `ToolsPanel.tsx` — collapsible panel with toggles (icon + name + description per tool); state persisted to session in DB
29. `ModelSelector.tsx` — dropdown over the curated model list
30. `ThemeToggle.tsx` — sun/moon icon, `next-themes`

### Phase 8 — Polish & Deploy
31. Mobile: sidebar as a slide-in drawer on small screens
32. Loading states: sidebar skeletons, streaming typing indicator
33. Empty chat state: illustrated placeholder before first message
34. Deploy: set all env vars in Vercel dashboard; configure Supabase Site URL and redirect URLs

---

**Relevant files** (all new):
- `src/app/api/chat/route.ts` — heart of the AI loop
- `src/lib/ai/tools/` — 5 tool implementations
- `src/middleware.ts` — auth gating
- `src/components/chat/ChatWindow.tsx` — main chat orchestrator
- `src/components/layout/Sidebar.tsx` — session navigation

**Environment variables needed**:
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard |
| `OPENROUTER_API_KEY` | openrouter.ai |

**Curated models**: Gemini 2.0 Flash (default), Gemini 2.5 Pro, Claude 3.5 Sonnet/Haiku, GPT-4o/mini, Llama 4 Scout, DeepSeek Chat v3

**Decisions made**:
- Tools execute entirely server-side (no client round-trips); agentic loop via `maxSteps: 5`
- Messages stored as JSONB in Supabase, in Vercel AI SDK's `CoreMessage` format for round-trip compatibility
- Session title auto-generated from the first 50 chars of the first user message
- URL reader blocks private IP ranges to prevent SSRF (OWASP compliance)