create extension if not exists pgcrypto;

create table if not exists public.user_rank_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  current_rank text not null check (current_rank in ('RECRUIT','CADET','OPERATOR','VANGUARD','DOMINION','ASCENDANT')),
  current_rank_sequence integer not null default 1,
  promotion_state text not null check (promotion_state in ('NOT ELIGIBLE','PROGRESSING','ELIGIBLE','PROMOTION PENDING','PROMOTED','BLOCKED','CORRECTIVE PERIOD')),
  active_corrective_period boolean not null default false,
  corrective_period_reason text,
  corrective_period_started_at timestamptz,
  corrective_period_review_date timestamptz,
  corrective_period_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_rank_status_user_unique unique (user_id)
);

create table if not exists public.rank_promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  prior_rank text not null check (prior_rank in ('RECRUIT','CADET','OPERATOR','VANGUARD','DOMINION','ASCENDANT')),
  new_rank text not null check (new_rank in ('RECRUIT','CADET','OPERATOR','VANGUARD','DOMINION','ASCENDANT')),
  prior_rank_sequence integer not null,
  new_rank_sequence integer not null,
  qualification_snapshot jsonb,
  promotion_review jsonb,
  effective_date date not null,
  finalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint rank_promotions_single_step check (new_rank_sequence = prior_rank_sequence + 1)
);

create table if not exists public.rank_status_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  prior_rank text check (prior_rank in ('RECRUIT','CADET','OPERATOR','VANGUARD','DOMINION','ASCENDANT')),
  new_rank text check (new_rank in ('RECRUIT','CADET','OPERATOR','VANGUARD','DOMINION','ASCENDANT')),
  prior_state text check (prior_state in ('NOT ELIGIBLE','PROGRESSING','ELIGIBLE','PROMOTION PENDING','PROMOTED','BLOCKED','CORRECTIVE PERIOD')),
  new_state text check (new_state in ('NOT ELIGIBLE','PROGRESSING','ELIGIBLE','PROMOTION PENDING','PROMOTED','BLOCKED','CORRECTIVE PERIOD')),
  event_metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_rank_status enable row level security;
alter table public.rank_promotions enable row level security;
alter table public.rank_status_events enable row level security;

drop policy if exists user_rank_status_select_own on public.user_rank_status;
create policy user_rank_status_select_own on public.user_rank_status for select using (auth.uid() = user_id);

drop policy if exists user_rank_status_insert_own on public.user_rank_status;
create policy user_rank_status_insert_own on public.user_rank_status for insert with check (auth.uid() = user_id);

drop policy if exists user_rank_status_update_own on public.user_rank_status;
create policy user_rank_status_update_own on public.user_rank_status for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists rank_promotions_select_own on public.rank_promotions;
create policy rank_promotions_select_own on public.rank_promotions for select using (auth.uid() = user_id);

drop policy if exists rank_promotions_insert_own on public.rank_promotions;
create policy rank_promotions_insert_own on public.rank_promotions for insert with check (auth.uid() = user_id);

drop policy if exists rank_promotions_update_own on public.rank_promotions;
create policy rank_promotions_update_own on public.rank_promotions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists rank_status_events_select_own on public.rank_status_events;
create policy rank_status_events_select_own on public.rank_status_events for select using (auth.uid() = user_id);

drop policy if exists rank_status_events_insert_own on public.rank_status_events;
create policy rank_status_events_insert_own on public.rank_status_events for insert with check (auth.uid() = user_id);

drop policy if exists rank_status_events_update_own on public.rank_status_events;
create policy rank_status_events_update_own on public.rank_status_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_rank_status_set_updated_at
before update on public.user_rank_status
for each row execute function public.set_updated_at();
