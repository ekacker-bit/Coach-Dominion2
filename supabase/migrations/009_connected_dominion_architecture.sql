Exit code: 0
Wall time: 0.7 seconds
Output:
-- Build 006A: provider-neutral Connected Dominion architecture.
-- Architecture only: no credentials, provider tokens, OAuth, or provider API access.

create table if not exists public.connected_accounts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_code text not null check (provider_code in ('STRAVA','GARMIN','APPLE_HEALTH','FITBOD','MYFITNESSPAL')),
  provider_display_name text not null,
  connection_status text not null check (connection_status in ('NOT_CONNECTED','CONNECTING','CONNECTED','REAUTH_REQUIRED','SYNC_ERROR','DISCONNECTED','DISABLED')),
  permissions jsonb not null default '[]'::jsonb check (jsonb_typeof(permissions) = 'array'),
  external_account_id text,
  external_account_label text,
  last_successful_sync_at timestamptz,
  last_attempted_sync_at timestamptz,
  last_sync_status text,
  last_sync_error_code text,
  last_sync_error_message text,
  sync_cursor text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_simulated boolean not null default true,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_simulated or connection_status <> 'CONNECTED')
);

create unique index if not exists connected_accounts_one_active_provider_idx
  on public.connected_accounts (user_id, provider_code)
  where connection_status not in ('DISCONNECTED','DISABLED');
create index if not exists connected_accounts_user_status_idx on public.connected_accounts (user_id, connection_status, updated_at desc);

create table if not exists public.integration_sync_jobs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  connected_account_id text not null references public.connected_accounts(id) on delete restrict,
  provider_code text not null check (provider_code in ('STRAVA','GARMIN','APPLE_HEALTH','FITBOD','MYFITNESSPAL')),
  sync_type text not null check (sync_type in ('INITIAL','INCREMENTAL','MANUAL','RETRY')),
  status text not null check (status in ('QUEUED','RUNNING','SUCCEEDED','PARTIAL','FAILED','CANCELLED')),
  requested_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  cursor_before text,
  cursor_after text,
  imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  unmapped_count integer not null default 0 check (unmapped_count >= 0),
  error_code text,
  error_message text,
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  check ((status in ('SUCCEEDED','PARTIAL','FAILED','CANCELLED')) = (completed_at is not null))
);

create index if not exists integration_sync_jobs_user_requested_idx on public.integration_sync_jobs (user_id, requested_at desc);
create index if not exists integration_sync_jobs_account_status_idx on public.integration_sync_jobs (connected_account_id, status, requested_at desc);

create table if not exists public.imported_records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  connected_account_id text not null references public.connected_accounts(id) on delete restrict,
  provider_code text not null check (provider_code in ('STRAVA','GARMIN','APPLE_HEALTH','FITBOD','MYFITNESSPAL')),
  provider_record_id text,
  provider_record_type text not null,
  source_created_at timestamptz,
  source_updated_at timestamptz,
  occurred_at text not null,
  timezone text not null default 'UTC',
  data_type text,
  normalized_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_payload) = 'object'),
  raw_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_payload) = 'object'),
  deduplication_key text not null,
  validation_status text not null check (validation_status in ('VALID','INVALID','PARTIAL','UNSUPPORTED')),
  import_status text not null check (import_status in ('RECEIVED','VALIDATED','DUPLICATE','REJECTED','MAPPED','UNMAPPED','INVALIDATED')),
  rejection_reason text,
  mapped_performance_entry_id uuid references public.performance_entries(id) on delete set null,
  source_sync_job_id text not null references public.integration_sync_jobs(id) on delete restrict,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists imported_records_user_dedup_idx on public.imported_records (user_id, deduplication_key);
create unique index if not exists imported_records_provider_identity_idx
  on public.imported_records (user_id, provider_code, provider_record_type, provider_record_id)
  where provider_record_id is not null;
create index if not exists imported_records_user_occurred_idx on public.imported_records (user_id, occurred_at desc);
create index if not exists imported_records_account_status_idx on public.imported_records (connected_account_id, import_status, created_at desc);

alter table public.connected_accounts enable row level security;
alter table public.integration_sync_jobs enable row level security;
alter table public.imported_records enable row level security;

drop policy if exists connected_accounts_select_own on public.connected_accounts;
create policy connected_accounts_select_own on public.connected_accounts for select using (auth.uid() = user_id);
drop policy if exists connected_accounts_insert_own on public.connected_accounts;
create policy connected_accounts_insert_own on public.connected_accounts for insert with check (auth.uid() = user_id);
drop policy if exists connected_accounts_update_own on public.connected_accounts;
create policy connected_accounts_update_own on public.connected_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists connected_accounts_delete_own on public.connected_accounts;
create policy connected_accounts_delete_own on public.connected_accounts for delete using (auth.uid() = user_id);

drop policy if exists integration_sync_jobs_select_own on public.integration_sync_jobs;
create policy integration_sync_jobs_select_own on public.integration_sync_jobs for select using (auth.uid() = user_id);
drop policy if exists integration_sync_jobs_insert_own on public.integration_sync_jobs;
create policy integration_sync_jobs_insert_own on public.integration_sync_jobs for insert with check (auth.uid() = user_id);
drop policy if exists integration_sync_jobs_update_own on public.integration_sync_jobs;
create policy integration_sync_jobs_update_own on public.integration_sync_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists integration_sync_jobs_delete_own on public.integration_sync_jobs;
create policy integration_sync_jobs_delete_own on public.integration_sync_jobs for delete using (auth.uid() = user_id);

drop policy if exists imported_records_select_own on public.imported_records;
create policy imported_records_select_own on public.imported_records for select using (auth.uid() = user_id);
drop policy if exists imported_records_insert_own on public.imported_records;
create policy imported_records_insert_own on public.imported_records for insert with check (auth.uid() = user_id);
drop policy if exists imported_records_update_own on public.imported_records;
create policy imported_records_update_own on public.imported_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists imported_records_delete_own on public.imported_records;
create policy imported_records_delete_own on public.imported_records for delete using (auth.uid() = user_id);

create or replace function public.set_connected_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists connected_accounts_set_updated_at on public.connected_accounts;
create trigger connected_accounts_set_updated_at before update on public.connected_accounts
for each row execute function public.set_connected_updated_at();
drop trigger if exists imported_records_set_updated_at on public.imported_records;
create trigger imported_records_set_updated_at before update on public.imported_records
for each row execute function public.set_connected_updated_at();

