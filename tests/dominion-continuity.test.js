const assert = require("node:assert/strict");
const test = require("node:test");

const continuity = require("../assets/js/dominion-continuity");

function plan(domain, revision, updatedAt, extra = {}) {
  return continuity.recordDescriptor(domain, {
    id: `${domain}-plan`,
    revision,
    status: "APPROVED",
    updatedAt,
    ...extra
  }, { immutable: true, stateType: "PLAN" });
}

test("stable fingerprints ignore object key order", () => {
  assert.equal(continuity.fingerprint({ a: 1, b: { c: 2 } }), continuity.fingerprint({ b: { c: 2 }, a: 1 }));
});

test("a higher canonical revision wins even when its timestamp is older", () => {
  const device = plan("strength", 3, "2026-08-01T08:00:00.000Z");
  const account = plan("strength", 2, "2026-08-01T09:00:00.000Z");
  assert.deepEqual(continuity.compareRecords(device, account, { immutable: true }), { state: "DEVICE_NEWER", winner: "DEVICE" });
});

test("a newer mutable checkpoint survives a stale account copy", () => {
  const device = continuity.recordDescriptor("calendar", { date: "2026-08-01", energy: 7 }, { stateType: "CHECKPOINT", updatedAt: "2026-08-01T16:00:00.000Z" });
  const account = continuity.recordDescriptor("calendar", { date: "2026-08-01", energy: 5 }, { stateType: "CHECKPOINT", updatedAt: "2026-08-01T15:00:00.000Z" });
  assert.equal(continuity.compareRecords(device, account).winner, "DEVICE");
});

test("divergent contents for the same immutable identity and revision require repair", () => {
  const device = plan("running", 2, "2026-08-01T12:00:00.000Z", { daysPerWeek: 4 });
  const account = plan("running", 2, "2026-08-01T13:00:00.000Z", { daysPerWeek: 5 });
  const result = continuity.compareRecords(device, account, { immutable: true });
  assert.equal(result.state, "CONFLICT");
  assert.equal(result.winner, null);
});

test("manifest fingerprint represents program truth, not device or save time", () => {
  const modules = { contract: { id: "contract-1", revision: 4, status: "APPROVED" } };
  const desktop = continuity.buildManifest(modules, { userId: "user-1", deviceId: "desktop", savedAt: "2026-08-01T10:00:00.000Z" });
  const phone = continuity.buildManifest(modules, { userId: "user-1", deviceId: "phone", savedAt: "2026-08-01T11:00:00.000Z" });
  assert.equal(desktop.fingerprint, phone.fingerprint);
});

test("cross-device reconciliation selects each genuinely newer domain", () => {
  const device = continuity.buildManifest({
    contract: plan("contract", 3, "2026-08-01T10:00:00.000Z"),
    strength: plan("strength", 2, "2026-08-01T10:00:00.000Z")
  }, { userId: "user-1", deviceId: "desktop" });
  const account = continuity.buildManifest({
    contract: plan("contract", 2, "2026-08-01T09:00:00.000Z"),
    strength: plan("strength", 3, "2026-08-01T11:00:00.000Z")
  }, { userId: "user-1", deviceId: "phone" });
  const result = continuity.reconcileManifests(device, account);
  assert.equal(result.state, "MERGED");
  assert.equal(result.manifest.modules.contract.revision, 3);
  assert.equal(result.manifest.modules.strength.revision, 3);
  assert.equal(result.conflicts.length, 0);
});

test("sync language tells the recruit whether data is truly synced", () => {
  assert.equal(continuity.syncPresentation("SYNCED").label, "SAVED & SYNCED");
  assert.equal(continuity.syncPresentation("OFFLINE").label, "SAVED ON DEVICE");
  assert.equal(continuity.syncPresentation("CONFLICT", { conflictCount: 2 }).label, "REPAIR NEEDED");
});

