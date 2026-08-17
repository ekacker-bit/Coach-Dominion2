-- Cover the nine reviewed foreign-key paths that remain unindexed after 029J.
-- The production tables are currently small, so a transactional index build
-- gives us an all-or-nothing release without a prolonged lock window.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '2min';

do $migration$
declare
  matched_count integer;
begin
  with expected(
    schema_name,
    table_name,
    constraint_name,
    column_name,
    referenced_schema,
    referenced_table,
    referenced_column,
    delete_action
  ) as (
    values
      ('public', 'coach_restrictions', 'coach_restrictions_user_id_fkey', 'user_id', 'auth', 'users', 'id', 'c'),
      ('public', 'imported_records', 'imported_records_mapped_performance_entry_id_fkey', 'mapped_performance_entry_id', 'public', 'performance_entries', 'id', 'n'),
      ('public', 'imported_records', 'imported_records_source_sync_job_id_fkey', 'source_sync_job_id', 'public', 'integration_sync_jobs', 'id', 'r'),
      ('public', 'integration_imports', 'integration_imports_user_id_fkey', 'user_id', 'auth', 'users', 'id', 'c'),
      ('public', 'nutrition_feed_events', 'nutrition_feed_events_token_id_fkey', 'token_id', 'public', 'nutrition_feed_tokens', 'id', 'r'),
      ('public', 'physique_region_assessments', 'physique_region_assessments_inspection_id_fkey', 'inspection_id', 'public', 'physique_inspections', 'id', 'c'),
      ('public', 'physique_region_assessments', 'physique_region_assessments_user_id_fkey', 'user_id', 'auth', 'users', 'id', 'c'),
      ('public', 'standards_violation_events', 'standards_violation_events_violation_id_fkey', 'violation_id', 'public', 'standards_violations', 'id', 'r'),
      ('public', 'workout_sets', 'workout_sets_user_id_fkey', 'user_id', 'auth', 'users', 'id', 'c')
  )
  select count(*)
  into matched_count
  from expected
  join pg_namespace table_namespace
    on table_namespace.nspname = expected.schema_name
  join pg_class child_table
    on child_table.relnamespace = table_namespace.oid
   and child_table.relname = expected.table_name
  join pg_constraint foreign_key
    on foreign_key.conrelid = child_table.oid
   and foreign_key.conname = expected.constraint_name
   and foreign_key.contype = 'f'
  join pg_attribute child_column
    on child_column.attrelid = child_table.oid
   and child_column.attname = expected.column_name
  join pg_class parent_table
    on parent_table.oid = foreign_key.confrelid
   and parent_table.relname = expected.referenced_table
  join pg_namespace parent_namespace
    on parent_namespace.oid = parent_table.relnamespace
   and parent_namespace.nspname = expected.referenced_schema
  join pg_attribute parent_column
    on parent_column.attrelid = parent_table.oid
   and parent_column.attname = expected.referenced_column
  where foreign_key.conkey = array[child_column.attnum]::smallint[]
    and foreign_key.confkey = array[parent_column.attnum]::smallint[]
    and foreign_key.confdeltype::text = expected.delete_action;

  if matched_count <> 9 then
    raise exception
      'Foreign-key baseline changed: expected 9 reviewed constraints, found %',
      matched_count;
  end if;
end
$migration$;

create index if not exists coach_restrictions_user_id_idx
  on public.coach_restrictions (user_id);

create index if not exists imported_records_mapped_performance_entry_id_idx
  on public.imported_records (mapped_performance_entry_id);

create index if not exists imported_records_source_sync_job_id_idx
  on public.imported_records (source_sync_job_id);

create index if not exists integration_imports_user_id_idx
  on public.integration_imports (user_id);

create index if not exists nutrition_feed_events_token_id_idx
  on public.nutrition_feed_events (token_id);

create index if not exists physique_region_assessments_inspection_id_idx
  on public.physique_region_assessments (inspection_id);

create index if not exists physique_region_assessments_user_id_idx
  on public.physique_region_assessments (user_id);

create index if not exists standards_violation_events_violation_id_idx
  on public.standards_violation_events (violation_id);

create index if not exists workout_sets_user_id_idx
  on public.workout_sets (user_id);

do $verification$
declare
  verified_count integer;
begin
  with expected(table_name, index_name, column_name) as (
    values
      ('coach_restrictions', 'coach_restrictions_user_id_idx', 'user_id'),
      ('imported_records', 'imported_records_mapped_performance_entry_id_idx', 'mapped_performance_entry_id'),
      ('imported_records', 'imported_records_source_sync_job_id_idx', 'source_sync_job_id'),
      ('integration_imports', 'integration_imports_user_id_idx', 'user_id'),
      ('nutrition_feed_events', 'nutrition_feed_events_token_id_idx', 'token_id'),
      ('physique_region_assessments', 'physique_region_assessments_inspection_id_idx', 'inspection_id'),
      ('physique_region_assessments', 'physique_region_assessments_user_id_idx', 'user_id'),
      ('standards_violation_events', 'standards_violation_events_violation_id_idx', 'violation_id'),
      ('workout_sets', 'workout_sets_user_id_idx', 'user_id')
  )
  select count(*)
  into verified_count
  from expected
  join pg_namespace table_namespace
    on table_namespace.nspname = 'public'
  join pg_class child_table
    on child_table.relnamespace = table_namespace.oid
   and child_table.relname = expected.table_name
  join pg_class child_index
    on child_index.relnamespace = table_namespace.oid
   and child_index.relname = expected.index_name
   and child_index.relkind = 'i'
  join pg_index index_catalog
    on index_catalog.indexrelid = child_index.oid
   and index_catalog.indrelid = child_table.oid
  join pg_attribute child_column
    on child_column.attrelid = child_table.oid
   and child_column.attname = expected.column_name
  where index_catalog.indisvalid
    and index_catalog.indisready
    and index_catalog.indnkeyatts >= 1
    and (index_catalog.indkey::smallint[])[0] = child_column.attnum;

  if verified_count <> 9 then
    raise exception
      'Foreign-key index verification failed: expected 9 leading indexes, found %',
      verified_count;
  end if;
end
$verification$;

commit;
