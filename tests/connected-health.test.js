const test = require("node:test");
const assert = require("node:assert/strict");

const Health = require("../assets/js/connected-health.js");

const current = [{ state: "CURRENT" }, { state: "CURRENT" }, { state: "CURRENT" }];

test("connection health exposes only the five truthful aggregate states", () => {
  assert.equal(Health.VERSION, "029F.1");
  assert.deepEqual(Object.values(Health.STATE), [
    "CONNECTED_CURRENT",
    "CONNECTED_STALE",
    "SETUP_REQUIRED",
    "SYNC_PENDING",
    "ERROR"
  ]);
});

test("ready requires every source to have current evidence", () => {
  assert.equal(Health.aggregate({ sources: current, accountState: "ACCOUNT_SAVED", online: true }).state, "CONNECTED_CURRENT");
  assert.equal(Health.aggregate({ sources: [{ state: "CURRENT" }, { state: "STALE" }, { state: "CURRENT" }] }).state, "CONNECTED_STALE");
  assert.equal(Health.aggregate({ sources: [{ state: "CURRENT" }, { state: "SETUP_REQUIRED" }, { state: "CURRENT" }] }).state, "SETUP_REQUIRED");
  assert.equal(Health.aggregate({ sources: [{ state: "CURRENT" }, { state: "NO_EVIDENCE" }, { state: "CURRENT" }] }).state, "SETUP_REQUIRED");
});

test("pending account saves override optimistic source status", () => {
  const result = Health.aggregate({ sources: current, accountState: "ACCOUNT_PENDING", online: true });
  assert.equal(result.state, "SYNC_PENDING");
  assert.match(Health.sentence(result), /server confirms it/);
});

test("failed imports and remote-load failures surface an error", () => {
  assert.equal(Health.aggregate({ sources: [{ state: "IMPORT_FAILED" }], accountState: "ACCOUNT_SAVED" }).state, "ERROR");
  assert.equal(Health.aggregate({ sources: current, remoteLoadFailed: true }).state, "ERROR");
});

test("demo connections cannot be presented as current evidence", () => {
  const source = Health.source({ state: "CURRENT", label: "Current", isSimulated: true });
  assert.equal(source.state, "SETUP_REQUIRED");
  assert.equal(source.label, "Setup required");
});
