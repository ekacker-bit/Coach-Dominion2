const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("027D migration widens all existing provider constraints without adding a public table", () => {
  const file = path.join(__dirname, "..", "supabase", "migrations", "20260815144525_connected_evidence_provider.sql");
  const sql = fs.readFileSync(file, "utf8");
  for (const table of ["connected_accounts", "integration_sync_jobs", "imported_records"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`${table}_provider_code_check`, "i"));
  }
  assert.match(sql, /HEALTH_CONNECT/);
  assert.doesNotMatch(sql, /create\s+table/i);
});
