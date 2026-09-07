-- Build 031H: atomic campaign archive/reset and stale-client protection.

begin;

alter table public.dominion_continuity_state
  add column if not exists campaign_id uuid,
  add column if not exists reset_epoch bigint not null default 0 check (reset_epoch >= 0),
  add column if not exists last_reset_id text,
  add column if not exists last_reset_at timestamptz;

update public.dominion_continuity_state
set campaign_id = gen_random_uuid()
where campaign_id is null;

alter table public.dominion_continuity_state
  alter column campaign_id set default gen_random_uuid(),
  alter column campaign_id set not null;

create table if not exists public.dominion_campaign_archive (
  archive_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null,
  reset_id text not null,
  continuity_revision bigint not null check (continuity_revision > 0),
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  truth_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(truth_snapshot) = 'object'),
  state_bundle jsonb not null default '{}'::jsonb check (jsonb_typeof(state_bundle) = 'object'),
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  archived_at timestamptz not null default now(),
  unique (user_id, campaign_id),
  unique (user_id, reset_id)
);

create index if not exists dominion_campaign_archive_user_archived_idx
  on public.dominion_campaign_archive (user_id, archived_at desc);

alter table public.dominion_campaign_archive enable row level security;

drop policy if exists dominion_campaign_archive_select_own on public.dominion_campaign_archive;
create policy dominion_campaign_archive_select_own
  on public.dominion_campaign_archive
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.dominion_campaign_archive from public, anon, authenticated;
grant select on table public.dominion_campaign_archive to authenticated;

create or replace function public.protect_weekly_inspection_snapshot()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
    and old.finalized_at is not null
    and coalesce(current_setting('coach_dominion.campaign_reset_user_id', true), '') <> old.user_id::text then
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

create or replace function public.protect_dominion_campaign_epoch()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  lifecycle_writer text := coalesce(current_setting('coach_dominion.lifecycle_write_user_id', true), '');
  reset_writer text := coalesce(current_setting('coach_dominion.campaign_reset_user_id', true), '');
begin
  if new.reset_epoch < old.reset_epoch then
    raise exception using errcode = '40001', message = 'DOMINION_CAMPAIGN_EPOCH_REGRESSION';
  end if;
  if old.reset_epoch > 0
    and lifecycle_writer <> old.user_id::text
    and reset_writer <> old.user_id::text
    and (
      new.campaign_id is distinct from old.campaign_id
      or new.reset_epoch is distinct from old.reset_epoch
      or new.manifest is distinct from old.manifest
      or new.truth_snapshot is distinct from old.truth_snapshot
    ) then
    raise exception using errcode = '40001', message = 'DOMINION_ACCOUNT_CLIENT_UPGRADE_REQUIRED';
  end if;
  if new.campaign_id is distinct from old.campaign_id
    and reset_writer <> old.user_id::text then
    raise exception using errcode = '42501', message = 'DOMINION_CAMPAIGN_CHANGE_REQUIRES_RESET';
  end if;
  return new;
end;
$$;

drop trigger if exists dominion_continuity_protect_campaign_epoch on public.dominion_continuity_state;
create trigger dominion_continuity_protect_campaign_epoch
  before update on public.dominion_continuity_state
  for each row execute function public.protect_dominion_campaign_epoch();

create or replace function public.sync_dominion_account_truth_v3(
  expected_revision bigint,
  expected_campaign_id uuid,
  expected_reset_epoch bigint,
  next_schema_version integer,
  next_truth_schema_version integer,
  next_device_id text,
  next_manifest jsonb,
  next_truth_snapshot jsonb,
  next_integrity_status text,
  next_client_updated_at timestamptz,
  next_mutation_id text,
  next_mutation_fingerprint text
)
returns public.dominion_continuity_state
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_row public.dominion_continuity_state;
  saved_row public.dominion_continuity_state;
  normalized_status text := upper(coalesce(nullif(trim(next_integrity_status), ''), 'VERIFIED'));
  normalized_mutation_id text := nullif(trim(next_mutation_id), '');
  normalized_mutation_fingerprint text := nullif(trim(next_mutation_fingerprint), '');
  initialized_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'DOMINION_ACCOUNT_AUTH_REQUIRED';
  end if;
  if normalized_mutation_id is null or normalized_mutation_fingerprint is null then
    raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_MUTATION_REQUIRED';
  end if;
  if jsonb_typeof(coalesce(next_manifest, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(next_truth_snapshot, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_TRUTH_INVALID_PAYLOAD';
  end if;
  if normalized_status not in ('VERIFIED', 'RECOVERED') then
    raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_TRUTH_INVALID_STATUS';
  end if;

  select * into current_row
  from public.dominion_continuity_state
  where user_id = auth.uid()
  for update;

  if found and current_row.last_mutation_id = normalized_mutation_id then
    if current_row.last_mutation_fingerprint is distinct from normalized_mutation_fingerprint then
      raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_MUTATION_ID_REUSED';
    end if;
    return current_row;
  end if;

  if not found then
    if coalesce(expected_revision, 0) <> 0 or coalesce(expected_reset_epoch, 0) <> 0 then
      raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
    end if;
    initialized_campaign_id := coalesce(expected_campaign_id, gen_random_uuid());
    insert into public.dominion_continuity_state (
      user_id, revision, schema_version, truth_schema_version, device_id,
      campaign_id, reset_epoch, manifest, truth_snapshot, integrity_status,
      client_updated_at, last_verified_at, last_error_code, last_error_at,
      last_mutation_id, last_mutation_fingerprint, last_acknowledged_at, updated_at
    ) values (
      auth.uid(), 1, next_schema_version, next_truth_schema_version, next_device_id,
      initialized_campaign_id, 0, coalesce(next_manifest, '{}'::jsonb), coalesce(next_truth_snapshot, '{}'::jsonb), normalized_status,
      coalesce(next_client_updated_at, now()), now(), null, null,
      normalized_mutation_id, normalized_mutation_fingerprint, now(), now()
    ) returning * into saved_row;
    return saved_row;
  end if;

  if current_row.revision <> coalesce(expected_revision, 0)
    or current_row.campaign_id is distinct from expected_campaign_id
    or current_row.reset_epoch <> coalesce(expected_reset_epoch, 0) then
    raise exception using errcode = '40001', message = 'DOMINION_CAMPAIGN_STALE_CLIENT';
  end if;

  perform set_config('coach_dominion.lifecycle_write_user_id', auth.uid()::text, true);
  update public.dominion_continuity_state
  set revision = current_row.revision + 1,
      schema_version = next_schema_version,
      truth_schema_version = next_truth_schema_version,
      device_id = next_device_id,
      manifest = coalesce(next_manifest, '{}'::jsonb),
      truth_snapshot = coalesce(next_truth_snapshot, '{}'::jsonb),
      integrity_status = normalized_status,
      client_updated_at = coalesce(next_client_updated_at, now()),
      last_verified_at = now(),
      last_error_code = null,
      last_error_at = null,
      last_mutation_id = normalized_mutation_id,
      last_mutation_fingerprint = normalized_mutation_fingerprint,
      last_acknowledged_at = now(),
      updated_at = now()
  where user_id = auth.uid()
  returning * into saved_row;
  return saved_row;
end;
$$;

revoke all on function public.sync_dominion_account_truth_v3(
  bigint, uuid, bigint, integer, integer, text, jsonb, jsonb, text, timestamptz, text, text
) from public, anon;
grant execute on function public.sync_dominion_account_truth_v3(
  bigint, uuid, bigint, integer, integer, text, jsonb, jsonb, text, timestamptz, text, text
) to authenticated;

create or replace function public.reset_dominion_campaign(
  reset_id text,
  expected_revision bigint,
  expected_campaign_id uuid,
  expected_reset_epoch bigint,
  next_campaign_id uuid,
  confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.dominion_continuity_state;
  archive_row public.dominion_campaign_archive;
  contract_payload jsonb := '{}'::jsonb;
  archive_summary jsonb;
  state_bundle jsonb;
  recorded_days integer := 0;
  completed_sessions integer := 0;
  normalized_reset_id text := nullif(trim(reset_id), '');
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'DOMINION_ACCOUNT_AUTH_REQUIRED';
  end if;
  if confirmation is distinct from 'START OVER' then
    raise exception using errcode = '22023', message = 'DOMINION_CAMPAIGN_CONFIRMATION_REQUIRED';
  end if;
  if normalized_reset_id is null or next_campaign_id is null or next_campaign_id = expected_campaign_id then
    raise exception using errcode = '22023', message = 'DOMINION_CAMPAIGN_RESET_INVALID';
  end if;

  select * into current_row
  from public.dominion_continuity_state
  where user_id = auth.uid()
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'DOMINION_CAMPAIGN_NOT_FOUND';
  end if;

  if current_row.last_reset_id = normalized_reset_id
    and current_row.campaign_id = next_campaign_id
    and current_row.reset_epoch = coalesce(expected_reset_epoch, 0) + 1 then
    select * into archive_row
    from public.dominion_campaign_archive a
    where a.user_id = auth.uid() and a.reset_id = normalized_reset_id;
    return jsonb_build_object(
      'status', 'VERIFIED', 'reset_id', normalized_reset_id,
      'previous_campaign_id', archive_row.campaign_id,
      'campaign_id', current_row.campaign_id,
      'reset_epoch', current_row.reset_epoch,
      'revision', current_row.revision,
      'archive_id', archive_row.archive_id,
      'archived_at', archive_row.archived_at
    );
  end if;

  if current_row.revision <> coalesce(expected_revision, 0)
    or current_row.campaign_id is distinct from expected_campaign_id
    or current_row.reset_epoch <> coalesce(expected_reset_epoch, 0) then
    raise exception using errcode = '40001', message = 'DOMINION_CAMPAIGN_STALE_CLIENT';
  end if;

  select coalesce(payload, '{}'::jsonb) into contract_payload
  from public.recruit_contract_state
  where user_id = auth.uid() and state_type = 'APPROVED'
  order by updated_at desc
  limit 1;

  select count(*)::integer into recorded_days from public.daily_state where user_id = auth.uid();
  select (
    (select count(*) from public.strength_training_state where user_id = auth.uid() and state_type = 'EXECUTION')
    + (select count(*) from public.running_state where user_id = auth.uid() and state_type = 'EXECUTION')
    + (select count(*) from public.core_program_state where user_id = auth.uid() and state_type = 'EXECUTION')
  )::integer into completed_sessions;

  archive_summary := jsonb_build_object(
    'goal', coalesce(contract_payload->>'target', contract_payload->>'primaryGoal', 'Campaign archived'),
    'contract_revision', case when coalesce(contract_payload->>'revision', '') ~ '^[0-9]+$' then (contract_payload->>'revision')::integer else 0 end,
    'recorded_days', recorded_days,
    'completed_sessions', completed_sessions,
    'progress_photos_preserved', (select count(*) from public.body_progress_photos where user_id = auth.uid()),
    'connected_sources_preserved', (select count(*) from public.connected_accounts where user_id = auth.uid())
  );

  state_bundle := jsonb_build_object(
    'daily_state', (select coalesce(jsonb_agg(to_jsonb(s) order by s.date), '[]'::jsonb) from public.daily_state s where s.user_id = auth.uid()),
    'command_feed', (select coalesce(jsonb_agg(to_jsonb(s) order by s.occurred_at), '[]'::jsonb) from public.command_feed s where s.user_id = auth.uid()),
    'daily_compliance', (select coalesce(jsonb_agg(to_jsonb(s) order by s.compliance_date), '[]'::jsonb) from public.daily_compliance s where s.user_id = auth.uid()),
    'weekly_inspections', (select coalesce(jsonb_agg(to_jsonb(s) order by s.week_start_date), '[]'::jsonb) from public.weekly_inspections s where s.user_id = auth.uid()),
    'standards_violations', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb) from public.standards_violations s where s.user_id = auth.uid()),
    'standards_violation_events', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb) from public.standards_violation_events s where s.user_id = auth.uid()),
    'rank_status', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.user_rank_status s where s.user_id = auth.uid()),
    'rank_promotions', (select coalesce(jsonb_agg(to_jsonb(s) order by s.finalized_at), '[]'::jsonb) from public.rank_promotions s where s.user_id = auth.uid()),
    'rank_events', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb) from public.rank_status_events s where s.user_id = auth.uid()),
    'performance_entries', (select coalesce(jsonb_agg(to_jsonb(s) order by s.performance_date), '[]'::jsonb) from public.performance_entries s where s.user_id = auth.uid()),
    'fitness_tests', (select coalesce(jsonb_agg(to_jsonb(s) order by s.test_date), '[]'::jsonb) from public.fitness_test_attempts s where s.user_id = auth.uid()),
    'personal_records', (select coalesce(jsonb_agg(to_jsonb(s) order by s.achieved_date), '[]'::jsonb) from public.personal_records s where s.user_id = auth.uid()),
    'milestones', (select coalesce(jsonb_agg(to_jsonb(s) order by s.achieved_date), '[]'::jsonb) from public.milestone_achievements s where s.user_id = auth.uid()),
    'atlas_reviews', (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at), '[]'::jsonb) from public.atlas_reviews s where s.user_id = auth.uid()),
    'contract', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.recruit_contract_state s where s.user_id = auth.uid()),
    'onboarding', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.recruit_onboarding_state s where s.user_id = auth.uid()),
    'strength', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.strength_training_state s where s.user_id = auth.uid()),
    'running', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.running_state s where s.user_id = auth.uid()),
    'core', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.core_program_state s where s.user_id = auth.uid()),
    'nutrition', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.nutrition_state s where s.user_id = auth.uid()),
    'calendar', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.weekly_orchestration_state s where s.user_id = auth.uid()),
    'split_day', (select coalesce(jsonb_agg(to_jsonb(s) order by s.checkpoint_date), '[]'::jsonb) from public.split_day_checkpoint_state s where s.user_id = auth.uid()),
    'coaching', (select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at), '[]'::jsonb) from public.coaching_loop_state s where s.user_id = auth.uid())
  );

  insert into public.dominion_campaign_archive (
    user_id, campaign_id, reset_id, continuity_revision,
    manifest, truth_snapshot, state_bundle, summary, archived_at
  ) values (
    auth.uid(), current_row.campaign_id, normalized_reset_id, current_row.revision,
    current_row.manifest, current_row.truth_snapshot, state_bundle, archive_summary, now()
  ) returning * into archive_row;

  perform set_config('coach_dominion.campaign_reset_user_id', auth.uid()::text, true);
  perform set_config('coach_dominion.lifecycle_write_user_id', auth.uid()::text, true);

  delete from public.standards_violation_events where user_id = auth.uid();
  delete from public.standards_violations where user_id = auth.uid();
  delete from public.rank_status_events where user_id = auth.uid();
  delete from public.rank_promotions where user_id = auth.uid();
  delete from public.user_rank_status where user_id = auth.uid();
  delete from public.weekly_inspections where user_id = auth.uid();
  delete from public.daily_compliance where user_id = auth.uid();
  delete from public.command_feed where user_id = auth.uid();
  delete from public.daily_state where user_id = auth.uid();
  delete from public.performance_entries where user_id = auth.uid();
  delete from public.fitness_test_attempts where user_id = auth.uid();
  delete from public.personal_records where user_id = auth.uid();
  delete from public.milestone_achievements where user_id = auth.uid();
  delete from public.atlas_reviews where user_id = auth.uid();
  delete from public.split_day_checkpoint_state where user_id = auth.uid();
  delete from public.weekly_orchestration_state where user_id = auth.uid();
  delete from public.coaching_loop_state where user_id = auth.uid();
  delete from public.nutrition_state where user_id = auth.uid();
  delete from public.core_program_state where user_id = auth.uid();
  delete from public.running_state where user_id = auth.uid();
  delete from public.strength_training_state where user_id = auth.uid();
  delete from public.recruit_onboarding_state where user_id = auth.uid();
  delete from public.recruit_contract_state where user_id = auth.uid();

  update public.dominion_continuity_state
  set revision = current_row.revision + 1,
      campaign_id = next_campaign_id,
      reset_epoch = current_row.reset_epoch + 1,
      manifest = '{}'::jsonb,
      truth_snapshot = '{}'::jsonb,
      integrity_status = 'VERIFIED',
      last_reset_id = normalized_reset_id,
      last_reset_at = archive_row.archived_at,
      last_mutation_id = 'campaign-reset:' || normalized_reset_id,
      last_mutation_fingerprint = encode(extensions.digest(current_row.campaign_id::text || ':' || next_campaign_id::text || ':' || normalized_reset_id, 'sha256'), 'hex'),
      last_verified_at = now(),
      last_acknowledged_at = now(),
      last_error_code = null,
      last_error_at = null,
      client_updated_at = now(),
      updated_at = now()
  where user_id = auth.uid()
  returning * into current_row;

  return jsonb_build_object(
    'status', 'VERIFIED',
    'reset_id', normalized_reset_id,
    'previous_campaign_id', archive_row.campaign_id,
    'campaign_id', current_row.campaign_id,
    'reset_epoch', current_row.reset_epoch,
    'revision', current_row.revision,
    'archive_id', archive_row.archive_id,
    'archived_at', archive_row.archived_at
  );
end;
$$;

revoke all on function public.reset_dominion_campaign(text, bigint, uuid, bigint, uuid, text) from public, anon;
grant execute on function public.reset_dominion_campaign(text, bigint, uuid, bigint, uuid, text) to authenticated;

commit;
