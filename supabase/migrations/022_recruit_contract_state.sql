-- Build 018B: account-scoped Recruit Contract drafts, approvals, and revision history.

create table if not exists public.recruit_contract_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_type text not null check (state_type in ('DRAFT', 'APPROVED', 'HISTORY')),
  state_key text not null default 'current',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) in ('object', 'array')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, state_type, state_key)
);

create index if not exists recruit_contract_state_user_updated_idx
  on public.recruit_contract_state (user_id, updated_at desc);

alter table public.recruit_contract_state enable row level security;

drop policy if exists recruit_contract_state_select_own on public.recruit_contract_state;
create policy recruit_contract_state_select_own on public.recruit_contract_state
  for select using (auth.uid() = user_id);

drop policy if exists recruit_contract_state_insert_own on public.recruit_contract_state;
create policy recruit_contract_state_insert_own on public.recruit_contract_state
  for insert with check (auth.uid() = user_id);

drop policy if exists recruit_contract_state_update_own on public.recruit_contract_state;
create policy recruit_contract_state_update_own on public.recruit_contract_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recruit_contract_state_delete_own on public.recruit_contract_state;
create policy recruit_contract_state_delete_own on public.recruit_contract_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.recruit_contract_state to authenticated;
