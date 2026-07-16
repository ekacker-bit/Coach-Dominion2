-- Finalize Build 001A for projects where the earlier 001A migration was already applied.
-- This migration preserves existing rows where possible and makes command_feed immutable.

alter table if exists public.daily_state
  drop column if exists readiness;

alter table if exists public.daily_state
  alter column confidence type numeric(3, 2) using least(1, greatest(0, coalesce(confidence::numeric, 0))),
  alter column confidence set default 0,
  alter column confidence set not null;

alter table if exists public.daily_state
  add column if not exists comments text;

alter table if exists public.daily_state
  drop constraint if exists daily_state_confidence_check,
  add constraint daily_state_confidence_check check (confidence between 0 and 1);

alter table if exists public.daily_state
  drop constraint if exists daily_state_comments_check,
  add constraint daily_state_comments_check check (comments is null or char_length(comments) <= 250);

create table if not exists public.command_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  event_type text not null,
  severity text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

update public.command_feed
set event_type = case event_type
  when 'morning_roll_call_submitted' then 'ROLL_CALL_SUBMITTED'
  when 'readiness_recalculated' then 'READINESS_UPDATED'
  when 'mission_generated' then 'MISSION_GENERATED'
  else event_type
end
where event_type in ('morning_roll_call_submitted', 'readiness_recalculated', 'mission_generated');

update public.command_feed
set event_type = 'ROLL_CALL_SUBMITTED'
where event_type not in ('ROLL_CALL_SUBMITTED', 'READINESS_UPDATED', 'MISSION_GENERATED');

update public.command_feed
set severity = upper(severity)
where severity in ('info', 'success', 'warning', 'critical');

update public.command_feed
set severity = 'INFO'
where severity not in ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

alter table if exists public.command_feed
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;

alter table if exists public.command_feed
  drop constraint if exists command_feed_event_type_check,
  add constraint command_feed_event_type_check check (event_type in ('ROLL_CALL_SUBMITTED', 'READINESS_UPDATED', 'MISSION_GENERATED'));

alter table if exists public.command_feed
  drop constraint if exists command_feed_severity_check,
  add constraint command_feed_severity_check check (severity in ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL'));

create index if not exists command_feed_user_occurred_at_idx
  on public.command_feed (user_id, occurred_at desc);

alter table public.command_feed enable row level security;

drop policy if exists "command_feed_update_own_rows" on public.command_feed;
drop policy if exists "command_feed_delete_own_rows" on public.command_feed;

drop policy if exists "command_feed_select_own_rows" on public.command_feed;
create policy "command_feed_select_own_rows"
  on public.command_feed
  for select
  using (auth.uid() = user_id);

drop policy if exists "command_feed_insert_own_rows" on public.command_feed;
create policy "command_feed_insert_own_rows"
  on public.command_feed
  for insert
  with check (auth.uid() = user_id);
