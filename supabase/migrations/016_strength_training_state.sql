-- Build 017A: account-backed strength profiles, plans, executions, and history.

create table if not exists public.strength_training_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in ('PROFILE', 'DRAFT', 'PLAN', 'EXECUTION', 'HISTORY')),
  state_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

create index if not exists strength_training_state_user_updated_idx
  on public.strength_training_state (user_id, updated_at desc);

alter table public.strength_training_state enable row level security;

drop policy if exists strength_training_state_select_own on public.strength_training_state;
create policy strength_training_state_select_own on public.strength_training_state
  for select using (auth.uid() = user_id);

drop policy if exists strength_training_state_insert_own on public.strength_training_state;
create policy strength_training_state_insert_own on public.strength_training_state
  for insert with check (auth.uid() = user_id);

drop policy if exists strength_training_state_update_own on public.strength_training_state;
create policy strength_training_state_update_own on public.strength_training_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists strength_training_state_delete_own on public.strength_training_state;
create policy strength_training_state_delete_own on public.strength_training_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.strength_training_state to authenticated;
