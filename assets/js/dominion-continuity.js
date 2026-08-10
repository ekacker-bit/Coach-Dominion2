(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContinuity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025F.1";
  const SCHEMA_VERSION = 2;
  const CANONICAL_DOMAINS = Object.freeze(["contract", "strength", "running", "core", "nutrition", "calendar"]);

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const source = stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function timestamp(value, fallback = null) {
    const candidates = [];
    const visit = (item, depth = 0) => {
      if (!item || depth > 4) return;
      if (Array.isArray(item)) {
        item.forEach((entry) => visit(entry, depth + 1));
        return;
      }
      if (typeof item !== "object") return;
      ["updatedAt", "updated_at", "approvedAt", "approved_at", "committedAt", "committed_at", "completedAt", "completed_at", "recordedAt", "recorded_at", "generatedAt", "generated_at", "signedAt", "signed_at", "effectiveDate"].forEach((key) => {
        const parsed = Date.parse(item[key] || "");
        if (Number.isFinite(parsed)) candidates.push(parsed);
      });
    };
    visit(value);
    const parsedFallback = Date.parse(fallback || "");
    if (Number.isFinite(parsedFallback)) candidates.push(parsedFallback);
    return candidates.length ? Math.max(...candidates) : 0;
  }

  function identity(value = {}, fallback = null) {
    return value.id || value.planId || value.blockId || value.contractId || value.weekId || value.baselineId || fallback || null;
  }

  function revision(value = {}) {
    const result = Number(value.revision ?? value.planRevision ?? value.contractRevision ?? value.weekRevision ?? 0);
    return Number.isFinite(result) ? result : 0;
  }

  function recordDescriptor(domain, payload, options = {}) {
    if (!payload) return null;
    return {
      domain,
      stateType: options.stateType || "ACTIVE",
      stateKey: options.stateKey || "current",
      id: identity(payload, options.id),
      revision: revision(payload),
      status: String(payload.status || options.status || "ACTIVE").toUpperCase(),
      updatedAt: options.updatedAt || (timestamp(payload) ? new Date(timestamp(payload)).toISOString() : null),
      fingerprint: fingerprint(payload),
      contractId: payload.recruitContractId || payload.contractId || null,
      contractRevision: Number(payload.recruitContractRevision ?? payload.contractRevision ?? 0),
      immutable: Boolean(options.immutable),
      source: options.source || "DEVICE"
    };
  }

  function snapshotDescriptor(domain, value = null) {
    if (!value || typeof value !== "object") return null;
    const payload = Object.prototype.hasOwnProperty.call(value, "payload") ? value.payload : value;
    if (!payload || typeof payload !== "object") return null;
    const updatedAt = value.updatedAt || (timestamp(payload) ? new Date(timestamp(payload)).toISOString() : null);
    return {
      domain,
      updatedAt,
      fingerprint: fingerprint(payload),
      payload
    };
  }

  function normalizeSnapshots(value = {}) {
    return Object.fromEntries(Object.entries(value || {})
      .map(([domain, snapshot]) => [domain, snapshotDescriptor(domain, snapshot)])
      .filter(([, snapshot]) => Boolean(snapshot)));
  }

  function compareSnapshots(deviceSnapshot, accountSnapshot) {
    if (!deviceSnapshot && !accountSnapshot) return { state: "EMPTY", winner: null };
    if (!accountSnapshot) return { state: "DEVICE_NEWER", winner: "DEVICE" };
    if (!deviceSnapshot) return { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    if (deviceSnapshot.fingerprint === accountSnapshot.fingerprint) return { state: "MATCHED", winner: "MATCHED" };
    const deviceTime = Date.parse(deviceSnapshot.updatedAt || "") || 0;
    const accountTime = Date.parse(accountSnapshot.updatedAt || "") || 0;
    if (accountTime > deviceTime) return { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    return { state: "DEVICE_NEWER", winner: "DEVICE" };
  }

  function compareRecords(localRecord, remoteRecord, options = {}) {
    if (!localRecord && !remoteRecord) return { state: "EMPTY", winner: null };
    if (!remoteRecord) return { state: "DEVICE_NEWER", winner: "DEVICE" };
    if (!localRecord) return { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    if (localRecord.fingerprint === remoteRecord.fingerprint) return { state: "MATCHED", winner: "MATCHED" };

    const immutable = Boolean(options.immutable ?? localRecord.immutable ?? remoteRecord.immutable);
    const localRevision = Number(localRecord.revision || 0);
    const remoteRevision = Number(remoteRecord.revision || 0);
    if (localRevision !== remoteRevision) {
      return localRevision > remoteRevision
        ? { state: "DEVICE_NEWER", winner: "DEVICE" }
        : { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    }

    const sameIdentity = Boolean(localRecord.id && remoteRecord.id && localRecord.id === remoteRecord.id);
    if (immutable && sameIdentity) {
      return { state: "CONFLICT", winner: null, reason: "Same immutable revision has different contents." };
    }

    const localTime = Date.parse(localRecord.updatedAt || "") || 0;
    const remoteTime = Date.parse(remoteRecord.updatedAt || "") || 0;
    if (localTime !== remoteTime) {
      return localTime > remoteTime
        ? { state: "DEVICE_NEWER", winner: "DEVICE" }
        : { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    }
    return { state: "CONFLICT", winner: null, reason: "Both copies changed without a newer authoritative timestamp." };
  }

  function buildManifest(input = {}, options = {}) {
    const savedAt = options.savedAt || new Date().toISOString();
    const modules = {};
    CANONICAL_DOMAINS.forEach((domain) => {
      const item = input[domain];
      modules[domain] = item?.fingerprint ? { ...item } : recordDescriptor(domain, item?.payload || item, item?.options || {});
    });
    const executions = (input.executions || []).filter(Boolean).map((item) => item.fingerprint ? { ...item } : recordDescriptor(item.domain, item.payload, item.options));
    const checkpoints = (input.checkpoints || []).filter(Boolean).map((item) => item.fingerprint ? { ...item } : recordDescriptor(item.domain, item.payload, item.options));
    const snapshots = normalizeSnapshots(input.snapshots || {});
    const body = {
      schemaVersion: SCHEMA_VERSION,
      userId: options.userId || null,
      deviceId: options.deviceId || null,
      savedAt,
      modules,
      executions,
      checkpoints,
      snapshots
    };
    return {
      ...body,
      fingerprint: fingerprint({
        schemaVersion: body.schemaVersion,
        userId: body.userId,
        modules: body.modules,
        executions: body.executions,
        checkpoints: body.checkpoints,
        snapshots: body.snapshots
      })
    };
  }

  function normalizeManifest(value = {}) {
    return buildManifest({
      ...value.modules,
      executions: value.executions || [],
      checkpoints: value.checkpoints || [],
      snapshots: value.snapshots || {}
    }, {
      userId: value.userId || null,
      deviceId: value.deviceId || null,
      savedAt: value.savedAt || new Date(0).toISOString()
    });
  }

  function reconcileManifests(deviceValue = {}, accountValue = {}) {
    const device = normalizeManifest(deviceValue);
    const account = normalizeManifest(accountValue);
    const modules = {};
    const snapshots = {};
    const conflicts = [];
    let deviceWins = 0;
    let accountWins = 0;
    CANONICAL_DOMAINS.forEach((domain) => {
      const comparison = compareRecords(device.modules[domain], account.modules[domain], { immutable: true });
      if (comparison.state === "CONFLICT") {
        conflicts.push({ domain, device: device.modules[domain], account: account.modules[domain], reason: comparison.reason });
        modules[domain] = device.modules[domain] || account.modules[domain];
      } else if (comparison.winner === "ACCOUNT") {
        accountWins += 1;
        modules[domain] = account.modules[domain];
      } else {
        if (comparison.winner === "DEVICE") deviceWins += 1;
        modules[domain] = device.modules[domain] || account.modules[domain];
      }
    });
    const snapshotDomains = new Set([...Object.keys(device.snapshots || {}), ...Object.keys(account.snapshots || {})]);
    snapshotDomains.forEach((domain) => {
      const comparison = compareSnapshots(device.snapshots?.[domain], account.snapshots?.[domain]);
      if (comparison.winner === "ACCOUNT") {
        accountWins += 1;
        snapshots[domain] = account.snapshots[domain];
      } else {
        if (comparison.winner === "DEVICE") deviceWins += 1;
        snapshots[domain] = device.snapshots?.[domain] || account.snapshots?.[domain];
      }
    });
    const merged = buildManifest({ ...modules, executions: device.executions, checkpoints: device.checkpoints, snapshots }, {
      userId: device.userId || account.userId,
      deviceId: device.deviceId,
      savedAt: new Date(Math.max(Date.parse(device.savedAt) || 0, Date.parse(account.savedAt) || 0)).toISOString()
    });
    return {
      state: conflicts.length ? "CONFLICT" : deviceWins && accountWins ? "MERGED" : deviceWins ? "DEVICE_NEWER" : accountWins ? "ACCOUNT_NEWER" : "MATCHED",
      conflicts,
      manifest: merged,
      deviceWins,
      accountWins
    };
  }

  function withSnapshot(manifest = {}, domain, payload, options = {}) {
    const normalized = normalizeManifest(manifest);
    return buildManifest({
      ...normalized.modules,
      executions: normalized.executions,
      checkpoints: normalized.checkpoints,
      snapshots: { ...normalized.snapshots, [domain]: payload }
    }, {
      userId: options.userId ?? normalized.userId,
      deviceId: options.deviceId ?? normalized.deviceId,
      savedAt: options.savedAt || normalized.savedAt || new Date().toISOString()
    });
  }

  function snapshotPayload(manifest = {}, domain) {
    return normalizeManifest(manifest).snapshots?.[domain]?.payload || null;
  }

  function syncPresentation(state = "CHECKING", options = {}) {
    const code = String(state || "CHECKING").toUpperCase();
    if (code === "SYNCED" || code === "MATCHED") return { code: "SYNCED", label: "SAVED & SYNCED", detail: "This device matches your Dominion account.", tone: "green" };
    if (code === "CONFLICT") return { code, label: "REPAIR NEEDED", detail: `${options.conflictCount || 1} saved-state conflict${Number(options.conflictCount || 1) === 1 ? "" : "s"} require your choice.`, tone: "red" };
    if (code === "OFFLINE") return { code, label: "SAVED ON DEVICE", detail: "Account sync will resume when the connection returns.", tone: "yellow" };
    if (code === "LOCAL_ONLY") return { code, label: "SAVED ON DEVICE", detail: "Continuity storage is not active on the account yet.", tone: "yellow" };
    if (code === "SYNCING") return { code, label: "SYNCING", detail: "Comparing program revisions with your account.", tone: "neutral" };
    return { code: "CHECKING", label: "VERIFYING", detail: "Checking Contract, plans, calendar, and sessions.", tone: "neutral" };
  }

  return Object.freeze({
    VERSION,
    SCHEMA_VERSION,
    CANONICAL_DOMAINS: [...CANONICAL_DOMAINS],
    stableSerialize,
    fingerprint,
    timestamp,
    identity,
    revision,
    recordDescriptor,
    snapshotDescriptor,
    normalizeSnapshots,
    compareSnapshots,
    compareRecords,
    buildManifest,
    normalizeManifest,
    reconcileManifests,
    withSnapshot,
    snapshotPayload,
    syncPresentation
  });
});
