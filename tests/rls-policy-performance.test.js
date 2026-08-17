const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260817173114_rls_policy_performance.sql"),
  "utf8"
);

test("optimizes only the reviewed simple owner-policy shapes", () => {
  assert.match(migration, /roles = array\['public'\]::name\[\]/i);
  assert.match(migration, /'\(auth\.uid\(\) = user_id\)'/i);
  assert.match(migration, /'\(auth\.uid\(\) = id\)'/i);
  assert.match(migration, /replace\(policy_row\.qual, 'auth\.uid\(\)', '\(select auth\.uid\(\)\)'\)/i);
  assert.match(migration, /replace\(policy_row\.with_check, 'auth\.uid\(\)', '\(select auth\.uid\(\)\)'\)/i);
});

test("preserves policy identity while narrowing evaluation to authenticated users", () => {
  assert.match(migration, /alter policy %I on %I\.%I to authenticated%s%s/i);
  assert.doesNotMatch(migration, /drop policy/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.doesNotMatch(migration, /grant\s+/i);
  assert.doesNotMatch(migration, /revoke\s+/i);
});

test("aborts on catalog drift instead of partially rewriting access rules", () => {
  assert.match(migration, /changed_count <> 125/i);
  assert.match(migration, /raise exception/i);
  assert.match(migration, /begin;/i);
  assert.match(migration, /commit;/i);
  assert.match(migration, /set local lock_timeout = '5s'/i);
  assert.match(migration, /set local statement_timeout = '2min'/i);
});
