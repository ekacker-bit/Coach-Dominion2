-- Build 015A: revocable MyFitnessPal nutrition feed through Apple Health and an iPhone Shortcut.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nutrition_feed_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'MyFitnessPal via Apple Health',
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_hint text not null check (char_length(token_hint) between 4 and 16),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVOKED')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check ((status = 'REVOKED') = (revoked_at is not null))
);

create unique index if not exists nutrition_feed_tokens_one_active_idx
  on public.nutrition_feed_tokens (user_id)
  where status = 'ACTIVE';

create table if not exists public.nutrition_feed_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_id uuid not null references public.nutrition_feed_tokens(id) on delete restrict,
  nutrition_date date not null,
  outcome text not null check (outcome in ('CREATED', 'UPDATED', 'DUPLICATE')),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  sample_count integer not null default 0 check (sample_count between 0 and 1000),
  received_at timestamptz not null default now()
);

create index if not exists nutrition_feed_events_user_received_idx
  on public.nutrition_feed_events (user_id, received_at desc);

alter table public.nutrition_feed_tokens enable row level security;
alter table public.nutrition_feed_events enable row level security;

drop policy if exists nutrition_feed_tokens_select_own on public.nutrition_feed_tokens;
create policy nutrition_feed_tokens_select_own on public.nutrition_feed_tokens
  for select using (auth.uid() = user_id);
drop policy if exists nutrition_feed_tokens_insert_own on public.nutrition_feed_tokens;
create policy nutrition_feed_tokens_insert_own on public.nutrition_feed_tokens
  for insert with check (auth.uid() = user_id);
drop policy if exists nutrition_feed_tokens_update_own on public.nutrition_feed_tokens;
create policy nutrition_feed_tokens_update_own on public.nutrition_feed_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists nutrition_feed_tokens_delete_own on public.nutrition_feed_tokens;
create policy nutrition_feed_tokens_delete_own on public.nutrition_feed_tokens
  for delete using (auth.uid() = user_id);

drop policy if exists nutrition_feed_events_select_own on public.nutrition_feed_events;
create policy nutrition_feed_events_select_own on public.nutrition_feed_events
  for select using (auth.uid() = user_id);

grant select, insert, update, delete on public.nutrition_feed_tokens to authenticated;
grant select on public.nutrition_feed_events to authenticated;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.connected_accounts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%is_simulated%'
  limit 1;
  if constraint_name is not null then
    execute format('alter table public.connected_accounts drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.connected_accounts
  drop constraint if exists connected_accounts_live_connection_check;
alter table public.connected_accounts
  add constraint connected_accounts_live_connection_check check (
    is_simulated
    or connection_status <> 'CONNECTED'
    or (
      provider_code = 'MYFITNESSPAL'
      and metadata ->> 'connection_mode' = 'APPLE_HEALTH_SHORTCUT'
    )
  );

create or replace function public.ingest_nutrition_feed(p_token text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_row public.nutrition_feed_tokens%rowtype;
  nutrition_date date;
  calories numeric;
  protein numeric;
  carbs numeric;
  fat numeric;
  sample_count integer;
  account_id text;
  job_id text;
  record_id text;
  record_exists boolean;
  prior_payload jsonb;
  normalized_payload jsonb;
  payload_hash text;
  outcome text;
  now_value timestamptz := clock_timestamp();
begin
  if p_token is null or p_token !~ '^cdnf_[A-Za-z0-9_-]{40,128}$' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_FEED_KEY');
  end if;

  select * into token_row
  from public.nutrition_feed_tokens
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  limit 1;

  if token_row.id is null then
    return jsonb_build_object('ok', false, 'error', 'INVALID_FEED_KEY');
  end if;
  if token_row.status <> 'ACTIVE' then
    return jsonb_build_object('ok', false, 'error', 'FEED_DISABLED');
  end if;

  if coalesce((p_payload ->> 'dryRun')::boolean, false) then
    update public.nutrition_feed_tokens set last_used_at = now_value where id = token_row.id;
    return jsonb_build_object('ok', true, 'dryRun', true, 'status', 'AUTHORIZED');
  end if;

  begin
    nutrition_date := (p_payload ->> 'date')::date;
    calories := coalesce((p_payload -> 'totals' ->> 'calories')::numeric, 0);
    protein := coalesce((p_payload -> 'totals' ->> 'protein')::numeric, 0);
    carbs := coalesce((p_payload -> 'totals' ->> 'carbs')::numeric, 0);
    fat := coalesce((p_payload -> 'totals' ->> 'fat')::numeric, 0);
    sample_count := coalesce((p_payload ->> 'sampleCount')::integer, 0);
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end;

  if abs(current_date - nutrition_date) > 31
    or calories < 0 or calories > 20000
    or protein < 0 or protein > 2000
    or carbs < 0 or carbs > 3000
    or fat < 0 or fat > 2000
    or sample_count < 0 or sample_count > 1000
    or calories + protein + carbs + fat <= 0 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_PAYLOAD');
  end if;

  select id into account_id
  from public.connected_accounts
  where user_id = token_row.user_id
    and provider_code = 'MYFITNESSPAL'
    and connection_status not in ('DISCONNECTED', 'DISABLED')
  order by created_at
  limit 1;

  if account_id is null then
    account_id := 'acct_mfp_healthkit_' || substr(md5(token_row.user_id::text), 1, 16);
    insert into public.connected_accounts (
      id, user_id, provider_code, provider_display_name, connection_status,
      permissions, external_account_label, metadata, is_simulated,
      last_successful_sync_at, last_attempted_sync_at, last_sync_status
    ) values (
      account_id, token_row.user_id, 'MYFITNESSPAL', 'MyFitnessPal', 'CONNECTED',
      '["READ_NUTRITION"]'::jsonb, 'Apple Health Shortcut',
      jsonb_build_object('connection_mode', 'APPLE_HEALTH_SHORTCUT', 'feed_token_id', token_row.id),
      false, now_value, now_value, 'SUCCEEDED'
    );
  else
    update public.connected_accounts
    set connection_status = 'CONNECTED',
        permissions = '["READ_NUTRITION"]'::jsonb,
        external_account_label = 'Apple Health Shortcut',
        metadata = metadata || jsonb_build_object('connection_mode', 'APPLE_HEALTH_SHORTCUT', 'feed_token_id', token_row.id),
        is_simulated = false,
        last_successful_sync_at = now_value,
        last_attempted_sync_at = now_value,
        last_sync_status = 'SUCCEEDED',
        last_sync_error_code = null,
        last_sync_error_message = null
    where id = account_id;
  end if;

  normalized_payload := jsonb_build_object(
    'calories', round(calories, 1),
    'protein_grams', round(protein, 1),
    'carbohydrate_grams', round(carbs, 1),
    'fat_grams', round(fat, 1),
    'sample_count', sample_count,
    'source_name', 'MyFitnessPal via Apple Health',
    'feed_version', p_payload ->> 'version'
  );
  payload_hash := encode(digest(normalized_payload::text, 'sha256'), 'hex');
  record_id := 'mfp_healthkit_' || substr(md5(token_row.user_id::text || '|' || nutrition_date::text), 1, 24);

  select true, imported.normalized_payload into record_exists, prior_payload
  from public.imported_records imported
  where imported.id = record_id;
  outcome := case
    when not coalesce(record_exists, false) then 'CREATED'
    when prior_payload = normalized_payload then 'DUPLICATE'
    else 'UPDATED'
  end;

  job_id := 'sync_mfp_healthkit_' || substr(md5(token_row.user_id::text || '|' || now_value::text || '|' || random()::text), 1, 24);
  insert into public.integration_sync_jobs (
    id, user_id, connected_account_id, provider_code, sync_type, status,
    requested_at, started_at, completed_at, imported_count, duplicate_count,
    rejected_count, unmapped_count, summary, is_demo
  ) values (
    job_id, token_row.user_id, account_id, 'MYFITNESSPAL', 'INCREMENTAL', 'SUCCEEDED',
    now_value, now_value, now_value,
    case when outcome = 'DUPLICATE' then 0 else 1 end,
    case when outcome = 'DUPLICATE' then 1 else 0 end,
    0, 0,
    jsonb_build_object(
      'connectionMode', 'APPLE_HEALTH_SHORTCUT',
      'nutritionDate', nutrition_date,
      'outcome', outcome,
      'sampleCount', sample_count,
      'rawHealthDataStored', false
    ),
    false
  );

  insert into public.imported_records (
    id, user_id, connected_account_id, provider_code, provider_record_id,
    provider_record_type, source_created_at, source_updated_at, occurred_at,
    timezone, data_type, normalized_payload, raw_payload, deduplication_key,
    validation_status, import_status, source_sync_job_id, is_demo
  ) values (
    record_id, token_row.user_id, account_id, 'MYFITNESSPAL',
    'mfp-healthkit-' || nutrition_date::text, 'HEALTHKIT_DAILY_NUTRITION',
    now_value, now_value, nutrition_date::text,
    left(coalesce(p_payload ->> 'timezone', 'UTC'), 64), 'MACRONUTRIENTS',
    normalized_payload,
    jsonb_build_object(
      'source', 'MYFITNESSPAL_APPLE_HEALTH',
      'sample_count', sample_count,
      'raw_health_data_stored', false
    ),
    'mfp-healthkit:' || nutrition_date::text,
    'VALID', 'MAPPED', job_id, false
  )
  on conflict (id) do update set
    normalized_payload = excluded.normalized_payload,
    raw_payload = excluded.raw_payload,
    source_updated_at = excluded.source_updated_at,
    timezone = excluded.timezone,
    validation_status = 'VALID',
    import_status = 'MAPPED',
    source_sync_job_id = excluded.source_sync_job_id,
    updated_at = now_value;

  insert into public.nutrition_feed_events (
    user_id, token_id, nutrition_date, outcome, payload_hash, sample_count, received_at
  ) values (
    token_row.user_id, token_row.id, nutrition_date, outcome, payload_hash, sample_count, now_value
  );
  update public.nutrition_feed_tokens set last_used_at = now_value where id = token_row.id;

  return jsonb_build_object(
    'ok', true,
    'date', nutrition_date,
    'outcome', outcome,
    'recordId', record_id,
    'receivedAt', now_value
  );
end;
$$;

revoke all on function public.ingest_nutrition_feed(text, jsonb) from public;
grant execute on function public.ingest_nutrition_feed(text, jsonb) to anon, authenticated;

create or replace function public.mark_revoked_nutrition_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'ACTIVE' and new.status = 'REVOKED' then
    update public.connected_accounts
    set connection_status = 'REAUTH_REQUIRED',
        last_sync_status = 'REAUTH_REQUIRED'
    where user_id = new.user_id
      and provider_code = 'MYFITNESSPAL'
      and metadata ->> 'feed_token_id' = new.id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists nutrition_feed_token_revoked on public.nutrition_feed_tokens;
create trigger nutrition_feed_token_revoked
after update of status on public.nutrition_feed_tokens
for each row execute function public.mark_revoked_nutrition_feed();
