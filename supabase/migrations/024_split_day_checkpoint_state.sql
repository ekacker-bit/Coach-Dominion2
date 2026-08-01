-- Build 020B: account-scoped between-session checkpoints for committed Two-a-Days.

create table if not exists public.split_day_checkpoint_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  checkpoint_date date not null,
  week_id text,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, checkpoint_date)
);

create index if not exists split_day_checkpoint_state_user_updated_idx
  on public.split_day_checkpoint_state (user_id, updated_at desc);

alter table public.split_day_checkpoint_state enable row level security;

drop policy if exists split_day_checkpoint_state_select_own on public.split_day_checkpoint_state;
create policy split_day_checkpoint_state_select_own on public.split_day_checkpoint_state
  for select using (auth.uid() = user_id);

drop policy if exists split_day_checkpoint_state_insert_own on public.split_day_checkpoint_state;
create policy split_day_checkpoint_state_insert_own on public.split_day_checkpoint_state
  for insert with check (auth.uid() = user_id);

drop policy if exists split_day_checkpoint_state_update_own on public.split_day_checkpoint_state;
create policy split_day_checkpoint_state_update_own on public.split_day_checkpoint_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists split_day_checkpoint_state_delete_own on public.split_day_checkpoint_state;
create policy split_day_checkpoint_state_delete_own on public.split_day_checkpoint_state
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.split_day_checkpoint_state to authenticated;
