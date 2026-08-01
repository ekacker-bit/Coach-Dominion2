-- Build 021C: account-scoped recruit profile and First Week Orientation state.
create table if not exists public.recruit_onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contract_id text not null,
  contract_revision integer not null check (contract_revision > 0),
  status text not null check (status in ('PROFILE_REQUIRED', 'IN_PROGRESS', 'COMPLETE')),
  current_step integer not null default 0 check (current_step between 0 and 3),
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  orientation jsonb not null default '{}'::jsonb check (jsonb_typeof(orientation) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruit_onboarding_state_contract_idx
  on public.recruit_onboarding_state (user_id, contract_id, contract_revision);

alter table public.recruit_onboarding_state enable row level security;

drop policy if exists recruit_onboarding_state_select_own on public.recruit_onboarding_state;
create policy recruit_onboarding_state_select_own on public.recruit_onboarding_state
  for select using (auth.uid() = user_id);

drop policy if exists recruit_onboarding_state_insert_own on public.recruit_onboarding_state;
create policy recruit_onboarding_state_insert_own on public.recruit_onboarding_state
  for insert with check (auth.uid() = user_id);

drop policy if exists recruit_onboarding_state_update_own on public.recruit_onboarding_state;
create policy recruit_onboarding_state_update_own on public.recruit_onboarding_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recruit_onboarding_state_delete_own on public.recruit_onboarding_state;
create policy recruit_onboarding_state_delete_own on public.recruit_onboarding_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.recruit_onboarding_state to authenticated;
