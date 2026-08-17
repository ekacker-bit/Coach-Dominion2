-- Release 029C: revision-safe, idempotent account persistence receipts.
-- The account-truth columns are repeated here with IF NOT EXISTS because the
-- production project can legitimately reach this release before Migration 028.

begin;

alter table public.dominion_continuity_state
  add column if not exists truth_schema_version integer not null default 1 check (truth_schema_version > 0),
  add column if not exists truth_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(truth_snapshot) = 'object'),
  add column if not exists integrity_status text not null default 'LEGACY_ACTIVE',
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists last_error_at timestamptz,
  add column if not exists last_mutation_id text,
  add column if not exists last_mutation_fingerprint text,
  add column if not exists last_acknowledged_at timestamptz;

comment on column public.dominion_continuity_state.last_mutation_id is
  'Stable client mutation ID. Replays return the prior receipt without incrementing revision.';

create or replace function public.sync_dominion_account_truth_v2(
  expected_revision bigint,
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
set search_path = public
as $$
declare
  current_row public.dominion_continuity_state;
  saved_row public.dominion_continuity_state;
  normalized_status text := upper(coalesce(nullif(trim(next_integrity_status), ''), 'VERIFIED'));
  normalized_mutation_id text := nullif(trim(next_mutation_id), '');
  normalized_mutation_fingerprint text := nullif(trim(next_mutation_fingerprint), '');
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
    if coalesce(expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
    end if;
    insert into public.dominion_continuity_state (
      user_id, revision, schema_version, truth_schema_version, device_id,
      manifest, truth_snapshot, integrity_status, client_updated_at,
      last_verified_at, last_error_code, last_error_at,
      last_mutation_id, last_mutation_fingerprint, last_acknowledged_at, updated_at
    ) values (
      auth.uid(), 1, next_schema_version, next_truth_schema_version, next_device_id,
      coalesce(next_manifest, '{}'::jsonb), coalesce(next_truth_snapshot, '{}'::jsonb), normalized_status,
      coalesce(next_client_updated_at, now()), now(), null, null,
      normalized_mutation_id, normalized_mutation_fingerprint, now(), now()
    ) returning * into saved_row;
    return saved_row;
  end if;

  if current_row.revision <> coalesce(expected_revision, 0) then
    raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
  end if;

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

revoke all on function public.sync_dominion_account_truth_v2(
  bigint, integer, integer, text, jsonb, jsonb, text, timestamptz, text, text
) from public, anon;

grant execute on function public.sync_dominion_account_truth_v2(
  bigint, integer, integer, text, jsonb, jsonb, text, timestamptz, text, text
) to authenticated;

commit;
