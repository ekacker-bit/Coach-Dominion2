const test = require("node:test");
const assert = require("node:assert/strict");

const Persistence = require("../assets/js/account-persistence.js");

function envelope(overrides = {}) {
  return Persistence.buildEnvelope({
    userId: "user-1",
    deviceId: "device-1",
    expectedRevision: 4,
    manifest: { fingerprint: "program-a", status: "ACTIVE" },
    snapshot: { fingerprint: "truth-a", domains: {} },
    clientUpdatedAt: "2026-08-17T12:00:00.000Z",
    ...overrides
  });
}

test("mutation identity is stable for the same account truth", () => {
  const first = envelope();
  const replay = envelope({ clientUpdatedAt: "2026-08-17T12:10:00.000Z" });
  assert.equal(first.mutationId, replay.mutationId);
  assert.equal(first.mutationFingerprint, replay.mutationFingerprint);
  assert.equal(first.manifestFingerprint, "program-a");
  assert.equal(first.truthFingerprint, "truth-a");
});

test("a pre-029C queued snapshot upgrades without losing protected work", () => {
  const upgraded = Persistence.buildEnvelope({
    snapshot: { fingerprint: "truth-legacy", domains: {} },
    queuedAt: "2026-08-17T11:00:00.000Z"
  }, {
    manifest: { fingerprint: "program-a", status: "ACTIVE" },
    userId: "user-1",
    deviceId: "device-1",
    expectedRevision: 4
  });
  assert.equal(upgraded.truthFingerprint, "truth-legacy");
  assert.equal(upgraded.manifestFingerprint, "program-a");
  assert.equal(upgraded.expectedRevision, 4);
});

test("retry queue keeps one exact envelope and backs off failed attempts", () => {
  const first = Persistence.queueLatest([], envelope(), null, { now: "2026-08-17T12:00:00.000Z" });
  const failed = Persistence.queueLatest(first, envelope(), { code: "NETWORK" }, {
    now: "2026-08-17T12:00:01.000Z",
    failedAttempt: true,
    random: 0.5
  });
  assert.equal(failed.length, 1);
  assert.equal(failed[0].attempts, 1);
  assert.equal(failed[0].errorCode, "NETWORK");
  assert.equal(Persistence.ready(failed, { now: "2026-08-17T12:00:01.500Z" }), null);
  assert.equal(Persistence.ready(failed, { now: "2026-08-17T12:00:02.000Z" }).mutationId, first[0].mutationId);
});

test("newer account truth supersedes an older queued mutation and stale work cannot replace it", () => {
  const oldWrite = envelope();
  const newerWrite = envelope({
    snapshot: { fingerprint: "truth-b", domains: {} },
    clientUpdatedAt: "2026-08-17T12:05:00.000Z"
  });
  const queued = Persistence.queueLatest([oldWrite], newerWrite, null, { now: "2026-08-17T12:05:00.000Z" });
  assert.equal(queued[0].truthFingerprint, "truth-b");
  assert.equal(queued[0].supersedesMutationId, oldWrite.mutationId);
  const staleAttempt = Persistence.queueLatest(queued, oldWrite, { code: "LATE_FAILURE" }, { now: "2026-08-17T12:06:00.000Z" });
  assert.equal(staleAttempt[0].truthFingerprint, "truth-b");
});

test("pending work clears only for the exact server receipt", () => {
  const write = envelope();
  const receipt = {
    revision: 5,
    manifest: write.manifest,
    truth_snapshot: write.snapshot,
    last_mutation_id: write.mutationId,
    last_mutation_fingerprint: write.mutationFingerprint
  };
  assert.equal(Persistence.receiptMatches(receipt, write), true);
  assert.equal(Persistence.receiptMatches({ ...receipt, last_mutation_id: "another-write" }, write), false);
  assert.equal(Persistence.receiptMatches({ ...receipt, revision: 4 }, write), false);
  assert.equal(Persistence.receiptMatches({ ...receipt, truth_snapshot: { fingerprint: "truth-b" } }, write), false);
});

test("status never calls an unconfirmed account current", () => {
  assert.equal(Persistence.status({ online: false, pendingWrites: 1 }).state, "OFFLINE_PROTECTED");
  assert.equal(Persistence.status({ online: true, pendingWrites: 1 }).state, "SAVE_QUEUED");
  assert.equal(Persistence.status({ online: true, lastError: "timeout" }).state, "RETRY_REQUIRED");
  assert.equal(Persistence.status({ online: true, serverConfirmed: false }).state, "VERIFYING");
  assert.equal(Persistence.status({ online: true, serverConfirmed: true, lastVerifiedAt: "2026-08-17T12:00:00.000Z" }).state, "ACCOUNT_SAVED");
});

test("auth recovery is bounded to sessions that can actually drain", () => {
  assert.equal(Persistence.shouldDrainForAuthEvent("SIGNED_IN", { user: { id: "user-1" } }), true);
  assert.equal(Persistence.shouldDrainForAuthEvent("TOKEN_REFRESHED", { user: { id: "user-1" } }), true);
  assert.equal(Persistence.shouldDrainForAuthEvent("SIGNED_OUT", null), false);
});

test("deterministic failures pause instead of retrying forever", () => {
  const states = Persistence.PERSISTENCE_STATES;
  assert.equal(Persistence.classifyFailure(null, { conflict: true }), states.CONFLICT_REQUIRES_CHOICE);
  assert.equal(Persistence.classifyFailure({ status: 401 }, {}), states.AUTH_REQUIRED);
  assert.equal(Persistence.classifyFailure({ status: 422 }, {}), states.VALIDATION_FAILURE);
  assert.equal(Persistence.classifyFailure({ code: "NETWORK" }, {}), states.TRANSIENT_FAILURE);
  assert.equal(Persistence.classifyFailure(null, { serverConfirmed: true, pendingWrites: 0 }), states.SYNCED);
  assert.equal(Persistence.shouldRetry(states.TRANSIENT_FAILURE), true);
  assert.equal(Persistence.shouldRetry(states.CONFLICT_REQUIRES_CHOICE), false);
  const paused = Persistence.queueLatest([], envelope(), { code: "CONFLICT" }, { conflict: true, failedAttempt: true, now: "2026-08-17T12:00:00.000Z" });
  assert.equal(paused[0].persistenceState, states.CONFLICT_REQUIRES_CHOICE);
  assert.equal(Persistence.ready(paused, { now: "2026-08-18T12:00:00.000Z" }), null);
});

test("030C exposes one canonical sync vocabulary and pauses user action", () => {
  const sync = Persistence.SYNC_STATES;
  assert.deepEqual(Object.values(sync), ["synced", "transient_retry", "offline_queued", "user_action_required", "conflict", "failed"]);
  assert.equal(Persistence.canonicalSyncState({ pendingWrites: 0 }), "synced");
  assert.equal(Persistence.canonicalSyncState({ pendingWrites: 1, online: false }), "offline_queued");
  assert.equal(Persistence.canonicalSyncState({ persistenceState: Persistence.PERSISTENCE_STATES.AUTH_REQUIRED, pendingWrites: 1 }), "user_action_required");
  assert.equal(Persistence.pendingState([], [{ ...envelope(), persistenceState: Persistence.PERSISTENCE_STATES.CONFLICT_REQUIRES_CHOICE }]).state, "conflict");
});

test("the same Nutrition mutation appears once across continuity and account truth", () => {
  const payload = { status: "APPROVED", calories: 2400, protein: 190 };
  const payloadHash = Persistence.fingerprint(payload);
  const continuity = [{
    id: "nutrition-write",
    domain: "nutrition",
    stateType: "BASELINE",
    stateKey: "current",
    payload,
    fingerprint: payloadHash,
    entity: "Nutrition",
    reason: "Network unavailable",
    queuedAt: "2026-08-20T12:00:00.000Z"
  }];
  const aggregate = [envelope({
    manifest: { fingerprint: "program-a", modules: { nutrition: { fingerprint: payloadHash } } },
    clientUpdatedAt: "2026-08-20T12:00:00.000Z"
  })];
  const pending = Persistence.pendingState(continuity, aggregate);
  assert.equal(pending.count, 1);
  assert.equal(pending.entries[0].entity, "Nutrition");
  assert.match(pending.detail, /Network unavailable/i);
});
