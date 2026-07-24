create table if not exists public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  performance_date date not null,
  performance_time time without time zone null,
  domain text not null,
  entry_type text not null,
  activity_code text null,
  activity_name text not null,
  session_name text null,
  source text not null default 'MANUAL',
  evidence_status text not null default 'SELF REPORTED',
  metrics jsonb not null default '{}'::jsonb,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists performance_entries_user_date_idx
  on public.performance_entries (user_id, performance_date desc);

alter table public.performance_entries enable row level security;

create policy if not exists "Users can manage their own performance entries"
  on public.performance_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
