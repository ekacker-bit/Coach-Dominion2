const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260817161809_production_security_hardening.sql"),
  "utf8"
);

test("quarantines empty legacy tables behind RLS and revoked Data API grants", () => {
  for (const table of ["users", "daily_reports"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`, "i"));
    assert.match(migration, new RegExp(`revoke all privileges on table public\\.${table} from anon, authenticated`, "i"));
  }
  assert.doesNotMatch(migration, /drop\s+table/i);
});

test("makes trigger functions non-callable and pins safe search paths", () => {
  for (const name of [
    "mark_revoked_nutrition_feed",
    "set_daily_state_updated_at",
    "set_daily_compliance_updated_at",
    "protect_weekly_inspection_snapshot",
    "set_updated_at"
  ]) {
    assert.match(migration, new RegExp(`alter function public\\.${name}\\(\\) set search_path = ''`, "i"));
    assert.match(migration, new RegExp(`revoke all on function public\\.${name}\\(\\) from public, anon, authenticated`, "i"));
  }
  assert.match(migration, /revoke all on function public\.handle_new_user\(\) from public, anon, authenticated/i);
});

test("keeps nutrition ingestion as one explicit token-authenticated exception", () => {
  assert.match(migration, /revoke all on function public\.ingest_nutrition_feed\(text, jsonb\) from public/i);
  assert.match(migration, /grant execute on function public\.ingest_nutrition_feed\(text, jsonb\) to anon, authenticated/i);
  assert.match(migration, /Accepts no caller-controlled user identity/i);
});

test("consolidates Weekly Inspection authorization and duplicate indexing", () => {
  assert.match(migration, /drop policy if exists weekly_inspections_own_all/i);
  assert.equal((migration.match(/create policy weekly_inspections_/gi) || []).length, 4);
  assert.equal((migration.match(/to authenticated/gi) || []).length, 4);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(migration, /drop index if exists public\.weekly_inspections_user_week_unique/i);
});

test("uses a bounded transactional migration", () => {
  assert.match(migration, /^--[\s\S]*\bbegin;/i);
  assert.match(migration, /set local lock_timeout = '5s'/i);
  assert.match(migration, /commit;\s*$/i);
});
