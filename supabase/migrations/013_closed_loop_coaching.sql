-- Build 014A: durable daily coaching decisions, evidence reviews, adaptations, and history.
create table if not exists public.coaching_loop_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in ('DECISION', 'REVIEW', 'ADAPTATION', 'HISTORY')),
  state_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

alter table public.coaching_loop_state enable row level security;

drop policy if exists "coaching_loop_state_select_own" on public.coaching_loop_state;
create policy "coaching_loop_state_select_own"
  on public.coaching_loop_state for select
  using (auth.uid() = user_id);

drop policy if exists "coaching_loop_state_insert_own" on public.coaching_loop_state;
create policy "coaching_loop_state_insert_own"
  on public.coaching_loop_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "coaching_loop_state_update_own" on public.coaching_loop_state;
create policy "coaching_loop_state_update_own"
  on public.coaching_loop_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "coaching_loop_state_delete_own" on public.coaching_loop_state;
create policy "coaching_loop_state_delete_own"
  on public.coaching_loop_state for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.coaching_loop_state to authenticated;

create index if not exists coaching_loop_state_updated_idx
  on public.coaching_loop_state (user_id, updated_at desc);
