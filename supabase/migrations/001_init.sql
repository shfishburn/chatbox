-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- chat_sessions
-- ============================================================
create table if not exists public.chat_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'New Chat',
  model         text not null default 'google/gemini-2.0-flash',
  tools_enabled text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast per-user sidebar queries
create index if not exists chat_sessions_user_id_idx
  on public.chat_sessions(user_id, updated_at desc);

-- Auto-update updated_at on any row change
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.touch_updated_at();

-- RLS
alter table public.chat_sessions enable row level security;

create policy "Users can view their own sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- messages
-- ============================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'tool')),
  content    jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_session_id_idx
  on public.messages(session_id, created_at asc);

-- RLS — users can access messages in their own sessions
alter table public.messages enable row level security;

create policy "Users can view messages in their sessions"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = messages.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their sessions"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = messages.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in their sessions"
  on public.messages for delete
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = messages.session_id and s.user_id = auth.uid()
    )
  );
