-- Build 027D Connected Evidence
-- Health Connect uses the existing user-scoped Connected Dominion tables.
-- Only the provider allowlist changes; RLS and all ownership policies remain intact.

begin;

set local lock_timeout = '5s';

alter table public.connected_accounts
  drop constraint if exists connected_accounts_provider_code_check;
alter table public.connected_accounts
  add constraint connected_accounts_provider_code_check
  check (provider_code in ('STRAVA', 'GARMIN', 'APPLE_HEALTH', 'HEALTH_CONNECT', 'FITBOD', 'MYFITNESSPAL')) not valid;
alter table public.connected_accounts
  validate constraint connected_accounts_provider_code_check;

alter table public.integration_sync_jobs
  drop constraint if exists integration_sync_jobs_provider_code_check;
alter table public.integration_sync_jobs
  add constraint integration_sync_jobs_provider_code_check
  check (provider_code in ('STRAVA', 'GARMIN', 'APPLE_HEALTH', 'HEALTH_CONNECT', 'FITBOD', 'MYFITNESSPAL')) not valid;
alter table public.integration_sync_jobs
  validate constraint integration_sync_jobs_provider_code_check;

alter table public.imported_records
  drop constraint if exists imported_records_provider_code_check;
alter table public.imported_records
  add constraint imported_records_provider_code_check
  check (provider_code in ('STRAVA', 'GARMIN', 'APPLE_HEALTH', 'HEALTH_CONNECT', 'FITBOD', 'MYFITNESSPAL')) not valid;
alter table public.imported_records
  validate constraint imported_records_provider_code_check;

commit;
