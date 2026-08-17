-- Production security hardening for the beta boundary.
--
-- public.users and public.daily_reports are empty legacy bootstrap tables. The
-- live application uses auth.users plus public.profiles and the canonical
-- account-scoped state tables instead. Keep the legacy tables for rollback
-- safety, but remove them from the Data API and deny every row by default.

begin;

set local lock_timeout = '5s';

alter table public.users enable row level security;
alter table public.users force row level security;
revoke all privileges on table public.users from anon, authenticated;
comment on table public.users is
  'Quarantined legacy bootstrap table. Coach Dominion identity is auth.users plus public.profiles.';

alter table public.daily_reports enable row level security;
alter table public.daily_reports force row level security;
revoke all privileges on table public.daily_reports from anon, authenticated;
comment on table public.daily_reports is
  'Quarantined legacy bootstrap table. Canonical daily evidence is stored in account-scoped application tables.';

-- Trigger functions are not public RPC endpoints. Revoking direct execution
-- does not prevent their registered triggers from running.
revoke all on function public.handle_new_user() from public, anon, authenticated;
comment on function public.handle_new_user() is
  'Trigger-only auth bootstrap function; direct Data API execution is prohibited.';

alter function public.mark_revoked_nutrition_feed() set search_path = '';
revoke all on function public.mark_revoked_nutrition_feed() from public, anon, authenticated;
comment on function public.mark_revoked_nutrition_feed() is
  'Trigger-only nutrition token revocation function; direct Data API execution is prohibited.';

alter function public.set_daily_state_updated_at() set search_path = '';
revoke all on function public.set_daily_state_updated_at() from public, anon, authenticated;

alter function public.set_daily_compliance_updated_at() set search_path = '';
revoke all on function public.set_daily_compliance_updated_at() from public, anon, authenticated;

alter function public.protect_weekly_inspection_snapshot() set search_path = '';
revoke all on function public.protect_weekly_inspection_snapshot() from public, anon, authenticated;

alter function public.set_updated_at() set search_path = '';
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- This SECURITY DEFINER RPC is the intentional exception: the caller proves
-- possession of a revocable, hashed feed token and never supplies a user ID.
-- PUBLIC remains revoked; only the two API roles used by the bridge may call it.
revoke all on function public.ingest_nutrition_feed(text, jsonb) from public;
grant execute on function public.ingest_nutrition_feed(text, jsonb) to anon, authenticated;
comment on function public.ingest_nutrition_feed(text, jsonb) is
  'Intentional token-authenticated nutrition bridge. Accepts no caller-controlled user identity.';

-- Replace overlapping public-role policies with one owner policy per action.
drop policy if exists weekly_inspections_own_all on public.weekly_inspections;
drop policy if exists weekly_inspections_select_own_rows on public.weekly_inspections;
drop policy if exists weekly_inspections_insert_own_rows on public.weekly_inspections;
drop policy if exists weekly_inspections_update_own_rows on public.weekly_inspections;
drop policy if exists weekly_inspections_delete_own_rows on public.weekly_inspections;

create policy weekly_inspections_select_own_rows
  on public.weekly_inspections for select to authenticated
  using ((select auth.uid()) = user_id);

create policy weekly_inspections_insert_own_rows
  on public.weekly_inspections for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy weekly_inspections_update_own_rows
  on public.weekly_inspections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy weekly_inspections_delete_own_rows
  on public.weekly_inspections for delete to authenticated
  using ((select auth.uid()) = user_id);

-- The table's UNIQUE (user_id, week_start_date) constraint already owns the
-- equivalent weekly_inspections_user_week_start_date_key index.
drop index if exists public.weekly_inspections_user_week_unique;

commit;
