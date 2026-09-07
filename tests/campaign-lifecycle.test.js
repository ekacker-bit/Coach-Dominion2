"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Campaign = require("../assets/js/campaign-lifecycle.js");
const Account = require("../assets/js/account-persistence.js");
const Truth = require("../assets/js/dominion-account-truth.js");

const campaignId = "11111111-1111-4111-8111-111111111111";
const nextCampaignId = "22222222-2222-4222-8222-222222222222";

function input(overrides = {}) {
  return {
    authenticated: true,
    online: true,
    userId: "recruit-1",
    pendingWrites: 0,
    confirmation: "START OVER",
    resetId: "reset:031h-test",
    nextCampaignId,
    lifecycle: { campaignId, resetEpoch: 2, accountRevision: 19 },
    ...overrides
  };
}

test("reset is fail-closed for auth, network, pending writes, and confirmation", () => {
  assert.equal(Campaign.buildResetCommand(input({ authenticated: false })).state, Campaign.RESET_STATES.AUTH_REQUIRED);
  assert.equal(Campaign.buildResetCommand(input({ online: false })).state, Campaign.RESET_STATES.OFFLINE_BLOCKED);
  assert.equal(Campaign.buildResetCommand(input({ pendingWrites: 2 })).state, Campaign.RESET_STATES.PENDING_WRITES);
  assert.equal(Campaign.buildResetCommand(input({ confirmation: "start over" })).state, Campaign.RESET_STATES.CONFIRMATION_REQUIRED);
  assert.equal(Campaign.buildResetCommand(input()).state, Campaign.RESET_STATES.READY);
});

test("ready reset carries exact authority and accepts only an exact receipt", () => {
  const command = Campaign.buildResetCommand(input());
  assert.deepEqual(Campaign.rpcArgs(command), {
    reset_id: "reset:031h-test",
    expected_revision: 19,
    expected_campaign_id: campaignId,
    expected_reset_epoch: 2,
    next_campaign_id: nextCampaignId,
    confirmation: "START OVER"
  });
  const receipt = {
    status: "VERIFIED",
    reset_id: command.resetId,
    previous_campaign_id: campaignId,
    campaign_id: nextCampaignId,
    reset_epoch: 3,
    revision: 20,
    archive_id: "archive-1",
    archived_at: "2026-09-07T12:00:00.000Z"
  };
  assert.equal(Campaign.receiptMatches(receipt, command), true);
  assert.equal(Campaign.receiptMatches({ ...receipt, reset_epoch: 2 }, command), false);
  assert.equal(Campaign.receiptMatches({ ...receipt, campaign_id: campaignId }, command), false);
});

test("a stale device never shares lifecycle authority with the new campaign", () => {
  const server = { campaignId: nextCampaignId, resetEpoch: 3, revision: 20 };
  const stale = Campaign.deviceState({
    server,
    marker: { campaignId, resetEpoch: 2 },
    snapshot: { lifecycle: { campaignId, resetEpoch: 2 } }
  });
  assert.equal(stale.current, false);
  assert.equal(stale.state, Campaign.RESET_STATES.STALE_CLIENT);
  const current = Campaign.deviceState({
    server,
    marker: { campaignId: nextCampaignId, resetEpoch: 3 },
    snapshot: { lifecycle: { campaignId: nextCampaignId, resetEpoch: 3 } }
  });
  assert.equal(current.current, true);
});

test("campaign cleanup preserves account identity, connected sources, and device settings", () => {
  const keys = [
    "sb-project-auth-token",
    "coach-dominion:continuity:device-id",
    "coach-dominion:time-zone",
    "coach-dominion:connected-accounts:recruit-1",
    "coach-dominion:imported-records:recruit-1",
    "coach-dominion:recruit-contract:recruit-1:approved",
    "coach-dominion:weekly-orchestration:recruit-1:week:current",
    "coach-dominion:account-truth:recruit-1:snapshot"
  ];
  assert.deepEqual(Campaign.storageKeysToRemove(keys, "recruit-1"), keys.slice(5));
});

test("account receipts include campaign identity", () => {
  const manifest = { fingerprint: "manifest-1" };
  const snapshot = { fingerprint: "truth-1" };
  const envelope = Account.buildEnvelope({
    userId: "recruit-1",
    deviceId: "device-1",
    campaignId,
    resetEpoch: 2,
    expectedRevision: 19,
    manifest,
    snapshot,
    mutationId: "mutation-1"
  });
  const receipt = {
    revision: 20,
    campaign_id: campaignId,
    reset_epoch: 2,
    manifest,
    truth_snapshot: snapshot,
    last_mutation_id: envelope.mutationId,
    last_mutation_fingerprint: envelope.mutationFingerprint
  };
  assert.equal(Account.receiptMatches(receipt, envelope), true);
  assert.equal(Account.receiptMatches({ ...receipt, reset_epoch: 3 }, envelope), false);
});

test("account truth chooses the higher reset generation instead of merging old evidence", () => {
  const oldSnapshot = Truth.buildSnapshot({ evidence: { performance: [{ id: "old-set", created_at: "2026-09-01T00:00:00Z" }] } }, {
    userId: "recruit-1", campaignId, resetEpoch: 2, capturedAt: "2026-09-01T00:00:00Z"
  });
  const newSnapshot = Truth.buildSnapshot({}, {
    userId: "recruit-1", campaignId: nextCampaignId, resetEpoch: 3, capturedAt: "2026-09-07T00:00:00Z"
  });
  const result = Truth.reconcileSnapshots(oldSnapshot, newSnapshot);
  assert.equal(result.state, "STALE_DEVICE");
  assert.equal(result.snapshot.lifecycle.campaignId, nextCampaignId);
  assert.equal(result.snapshot.domains.evidence.payload.performance.length, 0);
});
