const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260817175555_foreign_key_index_coverage.sql"),
  "utf8"
);

const expectedIndexes = [
  "coach_restrictions_user_id_idx",
  "imported_records_mapped_performance_entry_id_idx",
  "imported_records_source_sync_job_id_idx",
  "integration_imports_user_id_idx",
  "nutrition_feed_events_token_id_idx",
  "physique_region_assessments_inspection_id_idx",
  "physique_region_assessments_user_id_idx",
  "standards_violation_events_violation_id_idx",
  "workout_sets_user_id_idx"
];

test("covers every reviewed foreign-key path exactly once", () => {
  assert.equal((migration.match(/create index if not exists/gi) || []).length, 9);
  for (const indexName of expectedIndexes) {
    assert.match(migration, new RegExp(`create index if not exists ${indexName}`, "i"));
  }
});

test("guards the exact production constraint baseline", () => {
  assert.match(migration, /matched_count <> 9/i);
  assert.match(migration, /foreign_key\.conkey = array\[child_column\.attnum\]::smallint\[\]/i);
  assert.match(migration, /foreign_key\.confkey = array\[parent_column\.attnum\]::smallint\[\]/i);
  assert.match(migration, /foreign_key\.confdeltype::text = expected\.delete_action/i);
});

test("verifies leading-key coverage without changing relationship semantics", () => {
  assert.match(migration, /verified_count <> 9/i);
  assert.match(migration, /index_catalog\.indisvalid/i);
  assert.match(migration, /index_catalog\.indisready/i);
  assert.match(migration, /\(index_catalog\.indkey::smallint\[\]\)\[0\] = child_column\.attnum/i);
  assert.doesNotMatch(migration, /drop index|drop constraint|alter table/i);
});

test("bounds the transactional build", () => {
  assert.match(migration, /begin;/i);
  assert.match(migration, /commit;/i);
  assert.match(migration, /set local lock_timeout = '5s'/i);
  assert.match(migration, /set local statement_timeout = '2min'/i);
  assert.doesNotMatch(migration, /concurrently/i);
});
