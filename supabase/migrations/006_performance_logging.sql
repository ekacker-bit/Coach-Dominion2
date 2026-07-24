create extension if not exists pgcrypto;

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

alter table if exists public.performance_entries
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table if exists public.performance_entries
  alter column created_at set default now(),
  alter column created_at set not null;

alter table if exists public.performance_entries
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table if exists public.performance_entries
  drop constraint if exists performance_entries_metrics_check,
  add constraint performance_entries_metrics_check check (jsonb_typeof(metrics) = 'object');

create index if not exists performance_entries_user_date_idx
  on public.performance_entries (user_id, performance_date desc);

alter table if exists public.performance_entries enable row level security;

drop policy if exists performance_entries_select_own on public.performance_entries;
create policy performance_entries_select_own
  on public.performance_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists performance_entries_insert_own on public.performance_entries;
create policy performance_entries_insert_own
  on public.performance_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists performance_entries_update_own on public.performance_entries;
create policy performance_entries_update_own
  on public.performance_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists performance_entries_delete_own on public.performance_entries;
create policy performance_entries_delete_own
  on public.performance_entries
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists performance_entries_set_updated_at on public.performance_entries;
create trigger performance_entries_set_updated_at
before update on public.performance_entries
for each row execute function public.set_updated_at();
