-- Build 016A: authoritative, account-scoped persistence for nutrition planning state.

create table if not exists public.nutrition_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in (
    'BASELINE_HISTORY',
    'ADAPTIVE_GOAL',
    'ADAPTIVE_APPROVAL',
    'MEAL_WINDOW',
    'REVIEW_HISTORY',
    'MANUAL_DAY'
  )),
  state_key text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

create index if not exists nutrition_state_user_updated_idx
  on public.nutrition_state (user_id, updated_at desc);

alter table public.nutrition_state enable row level security;

drop policy if exists nutrition_state_select_own on public.nutrition_state;
create policy nutrition_state_select_own on public.nutrition_state
  for select using (auth.uid() = user_id);

drop policy if exists nutrition_state_insert_own on public.nutrition_state;
create policy nutrition_state_insert_own on public.nutrition_state
  for insert with check (auth.uid() = user_id);

drop policy if exists nutrition_state_update_own on public.nutrition_state;
create policy nutrition_state_update_own on public.nutrition_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nutrition_state_delete_own on public.nutrition_state;
create policy nutrition_state_delete_own on public.nutrition_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.nutrition_state to authenticated;

