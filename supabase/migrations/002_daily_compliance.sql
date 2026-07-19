-- Build 004A: one deterministic daily compliance record per authenticated user.

create table if not exists public.daily_compliance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  compliance_date date not null,

  mission_status text check (mission_status is null or mission_status in ('completed', 'partial', 'missed', 'excused', 'not_applicable')),
  mission_target text check (mission_target is null or char_length(mission_target) <= 500),
  mission_actual text check (mission_actual is null or char_length(mission_actual) <= 500),
  mission_note text check (mission_note is null or char_length(mission_note) <= 500),
  mission_restriction text check (mission_restriction is null or char_length(mission_restriction) <= 500),
  mission_approved_modification boolean not null default false,

  strength_status text check (strength_status is null or strength_status in ('completed', 'partial', 'missed', 'excused', 'not_applicable')),
  strength_target text check (strength_target is null or char_length(strength_target) <= 500),
  strength_actual text check (strength_actual is null or char_length(strength_actual) <= 500),
  strength_note text check (strength_note is null or char_length(strength_note) <= 500),
  strength_restriction text check (strength_restriction is null or char_length(strength_restriction) <= 500),
  strength_approved_modification boolean not null default false,

  cardio_status text check (cardio_status is null or cardio_status in ('completed', 'partial', 'missed', 'excused', 'not_applicable')),
  cardio_target text check (cardio_target is null or char_length(cardio_target) <= 500),
  cardio_actual text check (cardio_actual is null or char_length(cardio_actual) <= 500),
  cardio_note text check (cardio_note is null or char_length(cardio_note) <= 500),
  cardio_restriction text check (cardio_restriction is null or char_length(cardio_restriction) <= 500),
  cardio_approved_modification boolean not null default false,

  recovery_status text check (recovery_status is null or recovery_status in ('completed', 'partial', 'missed', 'excused', 'not_applicable')),
  recovery_target text check (recovery_target is null or char_length(recovery_target) <= 500),
  recovery_actual text check (recovery_actual is null or char_length(recovery_actual) <= 500),
  recovery_note text check (recovery_note is null or char_length(recovery_note) <= 500),
  recovery_restriction text check (recovery_restriction is null or char_length(recovery_restriction) <= 500),
  recovery_approved_modification boolean not null default false,

  nutrition_status text check (nutrition_status is null or nutrition_status in ('completed', 'partial', 'missed', 'excused', 'not_applicable')),
  nutrition_target text check (nutrition_target is null or char_length(nutrition_target) <= 500),
  nutrition_actual text check (nutrition_actual is null or char_length(nutrition_actual) <= 500),
  nutrition_note text check (nutrition_note is null or char_length(nutrition_note) <= 500),
  nutrition_restriction text check (nutrition_restriction is null or char_length(nutrition_restriction) <= 500),
  nutrition_approved_modification boolean not null default false,

  discipline_score numeric check (discipline_score is null or discipline_score between 0 and 100),
  score_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(score_evidence) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, compliance_date)
);

alter table public.daily_compliance enable row level security;

create policy "daily_compliance_select_own_rows"
  on public.daily_compliance
  for select
  using (auth.uid() = user_id);

create policy "daily_compliance_insert_own_rows"
  on public.daily_compliance
  for insert
  with check (auth.uid() = user_id);

create policy "daily_compliance_update_own_rows"
  on public.daily_compliance
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_compliance_delete_own_rows"
  on public.daily_compliance
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_daily_compliance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_compliance_set_updated_at on public.daily_compliance;
create trigger daily_compliance_set_updated_at
  before update on public.daily_compliance
  for each row
  execute function public.set_daily_compliance_updated_at();
