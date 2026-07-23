create extension if not exists pgcrypto;

create table if not exists public.standards_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  standard_code text not null,
  category text not null,
  title text not null,
  source_type text not null,
  source_id text,
  source_date date not null,
  domain text not null,
  evidence text,
  protected_exceptions text,
  candidate_reason text,
  classification text not null check (classification in ('CANDIDATE','UNDER REVIEW','CONFIRMED','CORRECTED','RESOLVED','DISMISSED','EXCUSED')),
  severity text not null check (severity in ('LEVEL I','LEVEL II','LEVEL III')),
  status text not null check (status in ('CANDIDATE','UNDER REVIEW','CONFIRMED','CORRECTED','RESOLVED','DISMISSED','EXCUSED')),
  corrective_action_type text,
  corrective_action_description text,
  corrective_action_due_date timestamptz,
  correction_note text,
  confirmed_at timestamptz,
  corrected_at timestamptz,
  resolved_at timestamptz,
  dismissed_at timestamptz,
  excused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standards_violations_user_standard_source_date_unique unique (user_id, standard_code, source_type, source_date, domain)
);

create table if not exists public.standards_violation_events (
  id uuid primary key default gen_random_uuid(),
  violation_id uuid not null references public.standards_violations (id) on delete restrict,
  user_id uuid not null,
  event_type text not null,
  prior_status text not null check (prior_status in ('CANDIDATE','UNDER REVIEW','CONFIRMED','CORRECTED','RESOLVED','DISMISSED','EXCUSED')),
  new_status text not null check (new_status in ('CANDIDATE','UNDER REVIEW','CONFIRMED','CORRECTED','RESOLVED','DISMISSED','EXCUSED')),
  note text,
  event_metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.standards_violations enable row level security;
alter table public.standards_violation_events enable row level security;

drop policy if exists standards_violations_select_own on public.standards_violations;
create policy standards_violations_select_own
  on public.standards_violations
  for select
  using (auth.uid() = user_id);

drop policy if exists standards_violations_insert_own on public.standards_violations;
create policy standards_violations_insert_own
  on public.standards_violations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists standards_violations_update_own on public.standards_violations;
create policy standards_violations_update_own
  on public.standards_violations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists standards_violations_delete_own on public.standards_violations;
create policy standards_violations_delete_own
  on public.standards_violations
  for delete
  using (auth.uid() = user_id);

drop policy if exists standards_violation_events_select_own on public.standards_violation_events;
create policy standards_violation_events_select_own
  on public.standards_violation_events
  for select
  using (auth.uid() = user_id);

drop policy if exists standards_violation_events_insert_own on public.standards_violation_events;
create policy standards_violation_events_insert_own
  on public.standards_violation_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists standards_violation_events_update_own on public.standards_violation_events;
create policy standards_violation_events_update_own
  on public.standards_violation_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists standards_violation_events_delete_own on public.standards_violation_events;
create policy standards_violation_events_delete_own
  on public.standards_violation_events
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger standards_violations_set_updated_at
before update on public.standards_violations
for each row execute function public.set_updated_at();
