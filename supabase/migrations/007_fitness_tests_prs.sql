create extension if not exists pgcrypto;

create table if not exists public.fitness_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  protocol_code text not null,
  protocol_name text null,
  protocol_version text null,
  test_date date not null,
  started_at timestamptz null,
  completed_at timestamptz null,
  status text not null default 'DRAFT',
  evidence_status text not null default 'SELF REPORTED',
  event_results jsonb not null default '[]'::jsonb,
  overall_score numeric null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  record_category text not null,
  domain text not null,
  activity_code text null,
  activity_name text null,
  comparison_key text null,
  source_entry_id uuid null,
  source_test_attempt_id uuid null,
  achieved_date date not null,
  raw_value numeric null,
  normalized_value numeric not null,
  unit text null,
  previous_record_value numeric null,
  improvement_absolute numeric null,
  improvement_percentage numeric null,
  evidence_status text not null default 'SELF REPORTED',
  record_status text not null default 'CONFIRMED',
  calculation_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.milestone_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  milestone_code text not null,
  title text not null,
  achieved_date date not null,
  source_entry_id uuid null,
  source_test_attempt_id uuid null,
  qualification_snapshot jsonb not null default '{}'::jsonb,
  evidence_status text not null default 'SELF REPORTED',
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'NO NEW RECORDS',
  new_records text null,
  milestones text null,
  strongest_result text null,
  improvement text null,
  limited_evidence boolean not null default false,
  next_benchmark text null,
  command_note text null,
  created_at timestamptz not null default now()
);

alter table public.fitness_test_attempts enable row level security;
alter table public.personal_records enable row level security;
alter table public.milestone_achievements enable row level security;
alter table public.atlas_reviews enable row level security;

create policy fitness_test_attempts_select_own on public.fitness_test_attempts
  for select using (auth.uid() = user_id);
create policy fitness_test_attempts_insert_own on public.fitness_test_attempts
  for insert with check (auth.uid() = user_id);
create policy fitness_test_attempts_update_own on public.fitness_test_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fitness_test_attempts_delete_own on public.fitness_test_attempts
  for delete using (auth.uid() = user_id);

create policy personal_records_select_own on public.personal_records
  for select using (auth.uid() = user_id);
create policy personal_records_insert_own on public.personal_records
  for insert with check (auth.uid() = user_id);
create policy personal_records_update_own on public.personal_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy personal_records_delete_own on public.personal_records
  for delete using (auth.uid() = user_id);

create policy milestone_achievements_select_own on public.milestone_achievements
  for select using (auth.uid() = user_id);
create policy milestone_achievements_insert_own on public.milestone_achievements
  for insert with check (auth.uid() = user_id);
create policy milestone_achievements_update_own on public.milestone_achievements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy milestone_achievements_delete_own on public.milestone_achievements
  for delete using (auth.uid() = user_id);

create policy atlas_reviews_select_own on public.atlas_reviews
  for select using (auth.uid() = user_id);
create policy atlas_reviews_insert_own on public.atlas_reviews
  for insert with check (auth.uid() = user_id);
create policy atlas_reviews_update_own on public.atlas_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy atlas_reviews_delete_own on public.atlas_reviews
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists fitness_test_attempts_set_updated_at on public.fitness_test_attempts;
create trigger fitness_test_attempts_set_updated_at
before update on public.fitness_test_attempts
for each row execute function public.set_updated_at();
