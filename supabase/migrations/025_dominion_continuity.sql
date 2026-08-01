-- Build 021B: one revisioned, account-scoped continuity ledger for the active Dominion program.

create table if not exists public.dominion_continuity_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  schema_version integer not null default 1 check (schema_version > 0),
  device_id text,
  manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(manifest) = 'object'),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dominion_continuity_state enable row level security;

drop policy if exists dominion_continuity_select_own on public.dominion_continuity_state;
create policy dominion_continuity_select_own on public.dominion_continuity_state
  for select using (auth.uid() = user_id);

drop policy if exists dominion_continuity_insert_own on public.dominion_continuity_state;
create policy dominion_continuity_insert_own on public.dominion_continuity_state
  for insert with check (auth.uid() = user_id);

drop policy if exists dominion_continuity_update_own on public.dominion_continuity_state;
create policy dominion_continuity_update_own on public.dominion_continuity_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.dominion_continuity_state to authenticated;

create or replace function public.sync_dominion_continuity_state(
  expected_revision bigint,
  next_schema_version integer,
  next_device_id text,
  next_manifest jsonb,
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
begin
  select * into current_row
  from public.dominion_continuity_state
  where user_id = auth.uid()
  for update;

  if not found then
    if coalesce(expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
    end if;
    insert into public.dominion_continuity_state (
      user_id, revision, schema_version, device_id, manifest, client_updated_at, updated_at
    ) values (
      auth.uid(), 1, next_schema_version, next_device_id, next_manifest, next_client_updated_at, now()
    ) returning * into saved_row;
    return saved_row;
  end if;

  if current_row.revision <> coalesce(expected_revision, 0) then
    raise exception using errcode = '40001', message = 'DOMINION_CONTINUITY_REVISION_CONFLICT';
  end if;

  update public.dominion_continuity_state
  set revision = current_row.revision + 1,
      schema_version = next_schema_version,
      device_id = next_device_id,
      manifest = next_manifest,
      client_updated_at = next_client_updated_at,
      updated_at = now()
  where user_id = auth.uid()
  returning * into saved_row;
  return saved_row;
end;
$$;

grant execute on function public.sync_dominion_continuity_state(bigint, integer, text, jsonb, timestamptz) to authenticated;
