# Chatbox

A multi-model AI chat application built to demonstrate the difference in LLM responses **with and without tools**. By enabling or disabling individual tools per conversation, you can directly compare how access to real-time data and capabilities changes the quality and accuracy of model responses.

## Features

- **Multiple LLMs via OpenRouter** — switch between models from Google, Anthropic, OpenAI, Meta, and DeepSeek in a single interface (Gemini 2.0 Flash, Gemini 2.5 Pro, Claude 3.5 Sonnet/Haiku, GPT-4o/Mini, Llama 4 Scout, DeepSeek Chat v3)
- **Toggleable tools** — enable or disable individual tools per session to observe their effect on responses:
  - **Calculator** — precise math, algebra, trigonometry, and unit conversions
  - **Web Search** — live web results via Tavily
  - **Weather** — current conditions and forecasts for any city
  - **Wikipedia** — factual lookups from Wikipedia
  - **URL Reader** — fetch and read the content of any URL
- **Persistent sessions** — chat history stored per user via Supabase
- **Authentication** — email/password auth powered by Supabase Auth
- **Dark/light theme** — system-aware with manual override

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Vercel AI SDK](https://sdk.vercel.ai) for streaming and tool-call support
- [OpenRouter](https://openrouter.ai) for unified LLM access
- [Supabase](https://supabase.com) for auth and database
- [Tailwind CSS](https://tailwindcss.com)

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (for auth and session storage)
- An [OpenRouter](https://openrouter.ai) API key (for LLM access)
- A [Tavily](https://tavily.com) API key (optional, required for Web Search tool)

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

OpenRouter and Tavily API keys are entered at runtime through the in-app API Key modal — no need to hard-code them.

3. Apply the database migrations to your Supabase project:

```bash
# Run the SQL in supabase/migrations/001_init.sql via the Supabase dashboard or CLI
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in your Vercel project settings. API keys for OpenRouter and Tavily are managed per-user at runtime.
