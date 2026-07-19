-- Build 004B: one deterministic weekly inspection snapshot per authenticated user and Monday-start week.

create table if not exists public.weekly_inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  inspection_status text not null check (inspection_status in ('not_ready', 'limited_evidence', 'ready_for_inspection', 'inspection_complete')),
  weekly_discipline_score numeric check (weekly_discipline_score is null or weekly_discipline_score between 0 and 100),
  evidence_coverage numeric not null check (evidence_coverage between 0 and 100),
  domain_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(domain_scores) = 'object'),
  aggregate_counts jsonb not null default '{}'::jsonb check (jsonb_typeof(aggregate_counts) = 'object'),
  strongest_domain text check (strongest_domain is null or strongest_domain in ('mission', 'strength', 'cardio', 'recovery', 'nutrition')),
  weakest_domain text check (weakest_domain is null or weakest_domain in ('mission', 'strength', 'cardio', 'recovery', 'nutrition')),
  next_week_priority jsonb not null default '{}'::jsonb check (jsonb_typeof(next_week_priority) = 'object'),
  report_evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(report_evidence) = 'object'),
  atlas_report jsonb not null default '{}'::jsonb check (jsonb_typeof(atlas_report) = 'object'),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date),
  check (extract(isodow from week_start_date) = 1),
  check (week_end_date = week_start_date + 6),
  check ((inspection_status = 'inspection_complete') = (finalized_at is not null))
);

alter table public.weekly_inspections enable row level security;

create policy "weekly_inspections_select_own_rows" on public.weekly_inspections for select using (auth.uid() = user_id);
create policy "weekly_inspections_insert_own_rows" on public.weekly_inspections for insert with check (auth.uid() = user_id);
create policy "weekly_inspections_update_own_rows" on public.weekly_inspections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_inspections_delete_own_rows" on public.weekly_inspections for delete using (auth.uid() = user_id);

create or replace function public.protect_weekly_inspection_snapshot()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.finalized_at is not null then
    raise exception 'Finalized weekly inspection snapshots are read-only';
  end if;
  if tg_op = 'UPDATE' and old.finalized_at is not null then
    raise exception 'Finalized weekly inspection snapshots are read-only';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at = now();
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists weekly_inspections_protect_snapshot on public.weekly_inspections;
create trigger weekly_inspections_protect_snapshot
  before update or delete on public.weekly_inspections
  for each row execute function public.protect_weekly_inspection_snapshot();
