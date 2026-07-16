create table if not exists public.daily_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  energy integer not null check (energy between 1 and 10),
  soreness integer not null check (soreness between 1 and 10),
  pain boolean not null,
  sleep numeric(4, 2),
  weight numeric(6, 2),
  steps integer check (steps >= 0),
  resting_heart_rate integer check (resting_heart_rate > 0),
  confidence numeric(3, 2) not null default 0 check (confidence between 0 and 1),
  comments text check (comments is null or char_length(comments) <= 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.daily_state enable row level security;

create policy "daily_state_select_own_rows"
  on public.daily_state
  for select
  using (auth.uid() = user_id);

create policy "daily_state_insert_own_rows"
  on public.daily_state
  for insert
  with check (auth.uid() = user_id);

create policy "daily_state_update_own_rows"
  on public.daily_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_state_delete_own_rows"
  on public.daily_state
  for delete
  using (auth.uid() = user_id);

create table if not exists public.command_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  event_type text not null check (event_type in ('ROLL_CALL_SUBMITTED', 'READINESS_UPDATED', 'MISSION_GENERATED')),
  severity text not null check (severity in ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists command_feed_user_occurred_at_idx
  on public.command_feed (user_id, occurred_at desc);

alter table public.command_feed enable row level security;

create policy "command_feed_select_own_rows"
  on public.command_feed
  for select
  using (auth.uid() = user_id);

create policy "command_feed_insert_own_rows"
  on public.command_feed
  for insert
  with check (auth.uid() = user_id);


create or replace function public.set_daily_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_state_set_updated_at on public.daily_state;
create trigger daily_state_set_updated_at
  before update on public.daily_state
  for each row
  execute function public.set_daily_state_updated_at();
