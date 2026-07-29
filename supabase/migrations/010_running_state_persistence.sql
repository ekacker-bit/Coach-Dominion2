-- Build 010C.1: authoritative persistence for running profiles, plans, execution, and reconciliation.
create table if not exists public.running_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in ('PROFILE','PLAN','EXECUTION','RECONCILIATION')),
  state_key text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

create index if not exists running_state_user_updated_idx on public.running_state (user_id, updated_at desc);
alter table public.running_state enable row level security;

drop policy if exists running_state_select_own on public.running_state;
create policy running_state_select_own on public.running_state for select using (auth.uid() = user_id);
drop policy if exists running_state_insert_own on public.running_state;
create policy running_state_insert_own on public.running_state for insert with check (auth.uid() = user_id);
drop policy if exists running_state_update_own on public.running_state;
create policy running_state_update_own on public.running_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists running_state_delete_own on public.running_state;
create policy running_state_delete_own on public.running_state for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.running_state to authenticated;

