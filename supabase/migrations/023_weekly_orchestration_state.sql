-- Build 018D: account-scoped unified weekly drafts and committed-week history.

create table if not exists public.weekly_orchestration_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in ('DRAFT', 'WEEK', 'HISTORY')),
  state_key text not null default 'current',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) in ('object', 'array')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

create index if not exists weekly_orchestration_state_user_updated_idx
  on public.weekly_orchestration_state (user_id, updated_at desc);

alter table public.weekly_orchestration_state enable row level security;

drop policy if exists weekly_orchestration_state_select_own on public.weekly_orchestration_state;
create policy weekly_orchestration_state_select_own on public.weekly_orchestration_state
  for select using (auth.uid() = user_id);

drop policy if exists weekly_orchestration_state_insert_own on public.weekly_orchestration_state;
create policy weekly_orchestration_state_insert_own on public.weekly_orchestration_state
  for insert with check (auth.uid() = user_id);

drop policy if exists weekly_orchestration_state_update_own on public.weekly_orchestration_state;
create policy weekly_orchestration_state_update_own on public.weekly_orchestration_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists weekly_orchestration_state_delete_own on public.weekly_orchestration_state;
create policy weekly_orchestration_state_delete_own on public.weekly_orchestration_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.weekly_orchestration_state to authenticated;
