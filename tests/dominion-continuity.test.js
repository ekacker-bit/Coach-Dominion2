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

test("account continuity carries a durable Core payload snapshot", () => {
  const coreSnapshot = {
    version: "025F.1",
    updatedAt: "2026-08-10T08:00:00.000Z",
    states: {
      "PLAN:current": {
        stateType: "PLAN",
        stateKey: "current",
        updatedAt: "2026-08-10T08:00:00.000Z",
        payload: { id: "core-plan-12", status: "APPROVED", recruitContractRevision: 12 }
      }
    }
  };
  const manifest = continuity.buildManifest({ snapshots: { core: coreSnapshot } }, { userId: "user-1" });
  assert.equal(continuity.SCHEMA_VERSION, 3);
  assert.deepEqual(continuity.snapshotPayload(manifest, "core"), coreSnapshot);
});

test("newer Core snapshot wins automatically without creating a plan conflict", () => {
  const device = continuity.buildManifest({
    snapshots: { core: { updatedAt: "2026-08-10T09:00:00.000Z", states: { "PLAN:current": { payload: { id: "new" } } } } }
  }, { userId: "user-1", deviceId: "desktop" });
  const account = continuity.buildManifest({
    snapshots: { core: { updatedAt: "2026-08-10T08:00:00.000Z", states: { "PLAN:current": { payload: { id: "old" } } } } }
  }, { userId: "user-1", deviceId: "phone" });
  const result = continuity.reconcileManifests(device, account);
  assert.equal(result.manifest.snapshots.core.payload.states["PLAN:current"].payload.id, "new");
  assert.equal(result.conflicts.length, 0);
});

test("withSnapshot preserves the rest of the account manifest", () => {
  const manifest = continuity.buildManifest({ contract: plan("contract", 4, "2026-08-10T07:00:00.000Z") }, { userId: "user-1" });
  const next = continuity.withSnapshot(manifest, "core", { updatedAt: "2026-08-10T08:00:00.000Z", states: {} });
  assert.equal(next.modules.contract.revision, 4);
  assert.ok(next.snapshots.core);
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
  assert.equal(continuity.syncPresentation("CONFLICT", { conflictCount: 2 }).label, "CHOICE NEEDED");
  assert.equal(continuity.syncPresentation("PENDING", { pendingCount: 2 }).label, "SAVED ON DEVICE");
});

test("volatile save timestamps do not create a program conflict", () => {
  const device = continuity.recordDescriptor("strength", {
    id: "strength-r4", revision: 4, status: "APPROVED", updatedAt: "2026-08-11T10:00:00.000Z", exercises: ["squat"]
  }, { stateType: "PLAN", immutable: true });
  const account = continuity.recordDescriptor("strength", {
    id: "strength-r4", revision: 4, status: "APPROVED", updatedAt: "2026-08-11T11:00:00.000Z", exercises: ["squat"]
  }, { stateType: "PLAN", immutable: true });
  assert.equal(continuity.compareRecords(device, account, { immutable: true }).state, "MATCHED");
});

test("a legacy descriptor upgrades automatically when the other side carries its recoverable payload", () => {
  const payload = { id: "core-r7", revision: 7, status: "APPROVED", recruitContractId: "contract-7", recruitContractRevision: 7 };
  const device = continuity.recordDescriptor("core", payload, { stateType: "PLAN", immutable: true });
  const account = { ...device };
  delete account.payload;
  const result = continuity.reconcileManifests(
    continuity.buildManifest({ core: device }, { userId: "user-1" }),
    continuity.buildManifest({ core: account }, { userId: "user-1" })
  );
  assert.equal(result.state, "DEVICE_NEWER");
  assert.deepEqual(result.manifest.modules.core.payload, payload);
  assert.equal(result.conflicts.length, 0);
});

test("the v3 manifest carries canonical payloads for account restoration", () => {
  const payload = { id: "running-r5", revision: 5, status: "APPROVED", recruitContractId: "contract-8", recruitContractRevision: 8 };
  const manifest = continuity.buildManifest({ running: { payload, options: { stateType: "PLAN", stateKey: "active", immutable: true } } }, { userId: "user-1" });
  assert.deepEqual(manifest.modules.running.payload, payload);
  assert.equal(manifest.modules.running.fingerprint, continuity.semanticFingerprint(payload));
});

test("empty module wrappers stay empty instead of becoming revision-zero programs", () => {
  const manifest = continuity.buildManifest({
    contract: { payload: null, options: { stateType: "APPROVED", immutable: true } },
    nutrition: { payload: null, options: { stateType: "BASELINE", immutable: true } }
  });
  assert.equal(manifest.modules.contract, null);
  assert.equal(manifest.modules.nutrition, null);
  assert.equal(continuity.canonicalLineage(manifest, { today: "2026-08-11" }).status, "CONTRACT_REQUIRED");
});

test("execution and checkpoint history survives reconciliation from both devices", () => {
  const device = continuity.buildManifest({
    executions: [{ domain: "strength", payload: { id: "lift-a", completedAt: "2026-08-10T10:00:00.000Z" }, options: { stateType: "EXECUTION", stateKey: "2026-08-10" } }],
    checkpoints: [{ domain: "calendar", payload: { id: "am-check", energy: 7 }, options: { stateType: "CHECKPOINT", stateKey: "2026-08-10" } }]
  });
  const account = continuity.buildManifest({
    executions: [{ domain: "running", payload: { id: "run-a", completedAt: "2026-08-10T18:00:00.000Z" }, options: { stateType: "EXECUTION", stateKey: "2026-08-10" } }],
    checkpoints: [{ domain: "calendar", payload: { id: "pm-check", energy: 5 }, options: { stateType: "CHECKPOINT", stateKey: "2026-08-10" } }]
  });
  const result = continuity.reconcileManifests(device, account);
  assert.equal(result.manifest.executions.length, 2);
  assert.equal(result.manifest.checkpoints.length, 2);
});

function linkedProgram(domain, contract, extra = {}) {
  return {
    payload: {
      id: `${domain}-r${contract.revision}`,
      revision: contract.revision,
      status: "APPROVED",
      recruitContractId: contract.id,
      recruitContractRevision: contract.revision,
      ...extra
    },
    options: { stateType: domain === "calendar" ? "WEEK" : domain === "nutrition" ? "BASELINE" : "PLAN", immutable: true }
  };
}

test("canonical lineage proves every active plan belongs to one Contract revision", () => {
  const contract = { id: "contract-12", revision: 12, status: "APPROVED", strengthDaysPerWeek: 4, runningDaysPerWeek: 3, coreDaysPerWeek: 3 };
  const manifest = continuity.buildManifest({
    contract: { payload: contract, options: { stateType: "APPROVED", immutable: true } },
    strength: linkedProgram("strength", contract),
    running: linkedProgram("running", contract),
    core: linkedProgram("core", contract),
    nutrition: linkedProgram("nutrition", contract),
    calendar: linkedProgram("calendar", contract, { weekStart: "2026-08-10", weekEnd: "2026-08-16" })
  });
  const lineage = continuity.canonicalLineage(manifest, { today: "2026-08-11" });
  assert.equal(lineage.status, "READY");
  assert.equal(lineage.completeCount, lineage.requiredCount);
  assert.equal(lineage.canonicalKey, "contract-12:r12");
});

test("the current week may finish on the prior Contract without being called corrupted", () => {
  const contract = { id: "contract-12", revision: 12, status: "APPROVED", strengthDaysPerWeek: 0, runningDaysPerWeek: 0, coreDaysPerWeek: 0 };
  const prior = { id: "contract-11", revision: 11 };
  const manifest = continuity.buildManifest({
    contract: { payload: contract, options: { stateType: "APPROVED", immutable: true } },
    nutrition: linkedProgram("nutrition", contract),
    calendar: linkedProgram("calendar", prior, { weekStart: "2026-08-10", weekEnd: "2026-08-16" })
  });
  const lineage = continuity.canonicalLineage(manifest, { today: "2026-08-11" });
  assert.equal(lineage.status, "TRANSITION");
  assert.equal(lineage.modules.calendar.state, "PROTECTED_CURRENT_WEEK");
  assert.match(lineage.headline, /next week/i);
});

test("a future week on an older Contract is a blocker", () => {
  const contract = { id: "contract-12", revision: 12, status: "APPROVED", strengthDaysPerWeek: 0, runningDaysPerWeek: 0, coreDaysPerWeek: 0 };
  const prior = { id: "contract-11", revision: 11 };
  const manifest = continuity.buildManifest({
    contract: { payload: contract, options: { stateType: "APPROVED", immutable: true } },
    nutrition: linkedProgram("nutrition", contract),
    calendar: linkedProgram("calendar", prior, { weekStart: "2026-08-17", weekEnd: "2026-08-23" })
  });
  const lineage = continuity.canonicalLineage(manifest, { today: "2026-08-11" });
  assert.equal(lineage.status, "ACTION_REQUIRED");
  assert.deepEqual(lineage.staleDomains, ["calendar"]);
});

