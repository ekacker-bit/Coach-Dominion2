-- Build 026I: atomically preserve program continuity and the broader account truth.

alter table public.dominion_continuity_state
  add column if not exists truth_schema_version integer not null default 1 check (truth_schema_version > 0),
  add column if not exists truth_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(truth_snapshot) = 'object'),
  add column if not exists integrity_status text not null default 'LEGACY_ACTIVE',
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists last_error_at timestamptz;

comment on column public.dominion_continuity_state.truth_snapshot is
  'Versioned account snapshot for readiness, evidence, profile continuity, and Atlas coaching memory.';

create or replace function public.sync_dominion_account_truth(
  expected_revision bigint,
  next_schema_version integer,
  next_truth_schema_version integer,
  next_device_id text,
  next_manifest jsonb,
  next_truth_snapshot jsonb,
  next_integrity_status text,
  next_client_updated_at timestamptz
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
begin
  if jsonb_typeof(coalesce(next_manifest, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(next_truth_snapshot, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_TRUTH_INVALID_PAYLOAD';
  end if;

  if normalized_status not in ('VERIFIED', 'RECOVERED', 'SAVE_QUEUED', 'OFFLINE_PROTECTED', 'RETRY_REQUIRED', 'LEGACY_ACTIVE') then
    raise exception using errcode = '22023', message = 'DOMINION_ACCOUNT_TRUTH_INVALID_STATUS';
  end if;

  select * into current_row
  from public.dominion_continuity_state
  where user_id = auth.uid()
  for update;

  if not found then
    if coalesce(expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
    end if;
    insert into public.dominion_continuity_state (
      user_id, revision, schema_version, truth_schema_version, device_id,
      manifest, truth_snapshot, integrity_status, client_updated_at,
      last_verified_at, last_error_code, last_error_at, updated_at
    ) values (
      auth.uid(), 1, next_schema_version, next_truth_schema_version, next_device_id,
      coalesce(next_manifest, '{}'::jsonb), coalesce(next_truth_snapshot, '{}'::jsonb), normalized_status,
      coalesce(next_client_updated_at, now()),
      case when normalized_status in ('VERIFIED', 'RECOVERED') then now() else null end,
      null, null, now()
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
      last_verified_at = case
        when normalized_status in ('VERIFIED', 'RECOVERED') then now()
        else current_row.last_verified_at
      end,
      last_error_code = null,
      last_error_at = null,
      updated_at = now()
  where user_id = auth.uid()
  returning * into saved_row;
  return saved_row;
end;
$$;

grant execute on function public.sync_dominion_account_truth(
  bigint, integer, integer, text, jsonb, jsonb, text, timestamptz
) to authenticated;
