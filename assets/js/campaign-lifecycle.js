(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionCampaignLifecycle = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031H.1";
  const SCHEMA_VERSION = 1;
  const CONFIRMATION = "START OVER";
  const RESET_STATES = Object.freeze({
    READY: "READY",
    AUTH_REQUIRED: "AUTH_REQUIRED",
    OFFLINE_BLOCKED: "OFFLINE_BLOCKED",
    PENDING_WRITES: "PENDING_WRITES",
    ACTIVE_CAMPAIGN_REQUIRED: "ACTIVE_CAMPAIGN_REQUIRED",
    CONFIRMATION_REQUIRED: "CONFIRMATION_REQUIRED",
    RESETTING: "RESETTING",
    VERIFIED: "VERIFIED",
    FAILED: "FAILED",
    STALE_CLIENT: "STALE_CLIENT"
  });

  function integer(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
  }

  function cleanId(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
      ? normalized
      : null;
  }

  function normalizeLifecycle(value = {}) {
    return {
      campaignId: cleanId(value.campaignId || value.campaign_id),
      resetEpoch: integer(value.resetEpoch ?? value.reset_epoch),
      accountRevision: integer(value.accountRevision ?? value.revision),
      lastResetId: String(value.lastResetId || value.last_reset_id || "").trim() || null,
      lastResetAt: value.lastResetAt || value.last_reset_at || null
    };
  }

  function markerKey(userId) {
    return `coach-dominion:campaign-lifecycle:${String(userId || "local")}`;
  }

  function snapshotLifecycle(snapshot = {}) {
    return normalizeLifecycle(snapshot.lifecycle || snapshot);
  }

  function sameLifecycle(left = {}, right = {}, options = {}) {
    const a = normalizeLifecycle(left);
    const b = normalizeLifecycle(right);
    if (a.resetEpoch !== b.resetEpoch) return false;
    if (a.campaignId && b.campaignId) return a.campaignId === b.campaignId;
    return options.allowLegacy === true && a.resetEpoch === 0 && b.resetEpoch === 0;
  }

  function deviceState(input = {}) {
    const server = normalizeLifecycle(input.server);
    const marker = normalizeLifecycle(input.marker);
    const snapshot = snapshotLifecycle(input.snapshot || {});
    if (!server.campaignId && server.resetEpoch === 0) {
      return { state: "UNINITIALIZED", current: true, server, marker, snapshot };
    }
    if (server.resetEpoch === 0 && !marker.campaignId && !snapshot.campaignId) {
      return { state: "LEGACY_CURRENT", current: true, server, marker, snapshot };
    }
    const markerCurrent = sameLifecycle(marker, server, { allowLegacy: true });
    const snapshotCurrent = !input.snapshot || sameLifecycle(snapshot, server, { allowLegacy: true });
    return {
      state: markerCurrent && snapshotCurrent ? "CURRENT" : RESET_STATES.STALE_CLIENT,
      current: markerCurrent && snapshotCurrent,
      server,
      marker,
      snapshot
    };
  }

  function randomId(prefix = "reset") {
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}:${uuid}`;
  }

  function randomCampaignId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function buildResetCommand(input = {}) {
    const lifecycle = normalizeLifecycle(input.lifecycle);
    const pendingWrites = integer(input.pendingWrites);
    const confirmation = String(input.confirmation || "").trim();
    let state = RESET_STATES.READY;
    let detail = "Ready to archive this campaign and begin a clean Contract.";
    if (!input.authenticated || !input.userId) {
      state = RESET_STATES.AUTH_REQUIRED;
      detail = "Sign in before starting a new campaign.";
    } else if (input.online === false) {
      state = RESET_STATES.OFFLINE_BLOCKED;
      detail = "Reconnect before starting over. Nothing will change offline.";
    } else if (pendingWrites > 0) {
      state = RESET_STATES.PENDING_WRITES;
      detail = `${pendingWrites} protected save${pendingWrites === 1 ? "" : "s"} must reach your account first.`;
    } else if (!lifecycle.campaignId || lifecycle.accountRevision < 1) {
      state = RESET_STATES.ACTIVE_CAMPAIGN_REQUIRED;
      detail = "There is no active campaign to archive.";
    } else if (confirmation !== CONFIRMATION) {
      state = RESET_STATES.CONFIRMATION_REQUIRED;
      detail = `Type ${CONFIRMATION} exactly to confirm.`;
    }
    const ready = state === RESET_STATES.READY;
    return {
      state,
      ready,
      detail,
      resetId: input.resetId || randomId(),
      nextCampaignId: cleanId(input.nextCampaignId) || randomCampaignId(),
      userId: input.userId || null,
      expectedRevision: lifecycle.accountRevision,
      expectedCampaignId: lifecycle.campaignId,
      expectedResetEpoch: lifecycle.resetEpoch,
      nextResetEpoch: lifecycle.resetEpoch + 1,
      confirmation
    };
  }

  function rpcArgs(command = {}) {
    if (!command.ready) return null;
    return {
      reset_id: command.resetId,
      expected_revision: command.expectedRevision,
      expected_campaign_id: command.expectedCampaignId,
      expected_reset_epoch: command.expectedResetEpoch,
      next_campaign_id: command.nextCampaignId,
      confirmation: CONFIRMATION
    };
  }

  function receiptMatches(receipt = {}, command = {}) {
    const value = Array.isArray(receipt) ? receipt[0] : receipt;
    return Boolean(
      command.ready
      && value?.status === RESET_STATES.VERIFIED
      && value?.reset_id === command.resetId
      && cleanId(value?.previous_campaign_id) === command.expectedCampaignId
      && cleanId(value?.campaign_id) === command.nextCampaignId
      && integer(value?.reset_epoch) === command.nextResetEpoch
      && integer(value?.revision) >= command.expectedRevision + 1
      && value?.archived_at
    );
  }

  function storageDisposition(key, userId) {
    const value = String(key || "");
    const user = String(userId || "local");
    if (!value.startsWith("coach-dominion:")) return "IGNORE";
    if (["coach-dominion:continuity:device-id", "coach-dominion:time-zone"].includes(value)) return "PRESERVE";
    if (value.startsWith("coach-dominion:service-worker-reload:")) return "PRESERVE";
    if ([
      `coach-dominion:connected-accounts:${user}`,
      `coach-dominion:integration-sync-jobs:${user}`,
      `coach-dominion:imported-records:${user}`,
      `coach-dominion:connected-ui:${user}`
    ].includes(value)) return "PRESERVE";
    if (value === markerKey(user)) return "PRESERVE";
    if (value.includes(`:${user}`) || value.includes(`:${user}:`)) return "REMOVE";
    return "IGNORE";
  }

  function storageKeysToRemove(keys = [], userId) {
    return [...keys].filter((key) => storageDisposition(key, userId) === "REMOVE");
  }

  function archiveSummary(row = {}) {
    const summary = row.summary && typeof row.summary === "object" ? row.summary : {};
    return {
      archiveId: row.archive_id || row.id || null,
      campaignId: cleanId(row.campaign_id),
      archivedAt: row.archived_at || null,
      goal: String(summary.goal || "Campaign archived"),
      contractRevision: integer(summary.contract_revision),
      recordedDays: integer(summary.recorded_days),
      completedSessions: integer(summary.completed_sessions)
    };
  }

  return Object.freeze({
    VERSION,
    SCHEMA_VERSION,
    CONFIRMATION,
    RESET_STATES: { ...RESET_STATES },
    normalizeLifecycle,
    markerKey,
    snapshotLifecycle,
    sameLifecycle,
    deviceState,
    buildResetCommand,
    rpcArgs,
    receiptMatches,
    storageDisposition,
    storageKeysToRemove,
    archiveSummary
  });
});
