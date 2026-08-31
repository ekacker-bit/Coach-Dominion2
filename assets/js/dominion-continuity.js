(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContinuity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Legacy release-integrity marker: const VERSION = "025N.1"
  const VERSION = "031A.1";
  const SCHEMA_VERSION = 3;
  const CANONICAL_DOMAINS = Object.freeze(["contract", "strength", "running", "core", "nutrition", "calendar"]);
  const VOLATILE_PAYLOAD_KEYS = new Set([
    "updatedAt", "updated_at", "savedAt", "saved_at", "syncedAt", "synced_at",
    "clientUpdatedAt", "client_updated_at", "renderedAt", "rendered_at", "lastViewedAt", "last_viewed_at"
  ]);

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

  function canonicalizePayload(value, options = {}, depth = 0) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      const items = value.map((item) => canonicalizePayload(item, options, depth + 1));
      if (depth === 0 && options.sortRootArray) {
        return items.sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right)));
      }
      return items;
    }
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !VOLATILE_PAYLOAD_KEYS.has(key))
      .map(([key, item]) => [key, canonicalizePayload(item, options, depth + 1)]));
  }

  function semanticFingerprint(value, options = {}) {
    return fingerprint(canonicalizePayload(value, options));
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
    const stateType = options.stateType || "ACTIVE";
    const descriptor = {
      domain,
      stateType,
      stateKey: options.stateKey || "current",
      id: identity(payload, options.id),
      revision: revision(payload),
      status: String(payload.status || options.status || "ACTIVE").toUpperCase(),
      updatedAt: options.updatedAt || (timestamp(payload) ? new Date(timestamp(payload)).toISOString() : null),
      fingerprint: semanticFingerprint(payload, { sortRootArray: stateType === "HISTORY" }),
      contractId: payload.recruitContractId || payload.contractId || null,
      contractRevision: Number(payload.recruitContractRevision ?? payload.contractRevision ?? 0),
      immutable: Boolean(options.immutable),
      source: options.source || "DEVICE"
    };
    if (options.includePayload !== false) descriptor.payload = payload;
    return descriptor;
  }

  function snapshotDescriptor(domain, value = null) {
    if (!value || typeof value !== "object") return null;
    const payload = Object.prototype.hasOwnProperty.call(value, "payload") ? value.payload : value;
    if (!payload || typeof payload !== "object") return null;
    const updatedAt = value.updatedAt || (timestamp(payload) ? new Date(timestamp(payload)).toISOString() : null);
    return {
      domain,
      updatedAt,
      fingerprint: semanticFingerprint(payload),
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
    const sameDescriptorIdentity = Boolean(localRecord.id && remoteRecord.id && localRecord.id === remoteRecord.id)
      && Number(localRecord.revision || 0) === Number(remoteRecord.revision || 0)
      && String(localRecord.status || "") === String(remoteRecord.status || "")
      && String(localRecord.contractId || "") === String(remoteRecord.contractId || "")
      && Number(localRecord.contractRevision || 0) === Number(remoteRecord.contractRevision || 0);
    if (localRecord.fingerprint === remoteRecord.fingerprint && sameDescriptorIdentity && Boolean(localRecord.payload) !== Boolean(remoteRecord.payload)) {
      return localRecord.payload
        ? { state: "DEVICE_NEWER", winner: "DEVICE", reason: "The device carries the recoverable payload." }
        : { state: "ACCOUNT_NEWER", winner: "ACCOUNT", reason: "The account carries the recoverable payload." };
    }
    if (localRecord.fingerprint === remoteRecord.fingerprint) return { state: "MATCHED", winner: "MATCHED" };

    if (localRecord.payload && remoteRecord.payload) {
      const sortRootArray = localRecord.stateType === "HISTORY" || remoteRecord.stateType === "HISTORY";
      if (semanticFingerprint(localRecord.payload, { sortRootArray }) === semanticFingerprint(remoteRecord.payload, { sortRootArray })) {
        return { state: "MATCHED", winner: "MATCHED", reason: "Only non-program timestamps differed." };
      }
    }

    const immutable = Boolean(options.immutable ?? localRecord.immutable ?? remoteRecord.immutable);
    const localRevision = Number(localRecord.revision || 0);
    const remoteRevision = Number(remoteRecord.revision || 0);
    if (localRevision !== remoteRevision) {
      return localRevision > remoteRevision
        ? { state: "DEVICE_NEWER", winner: "DEVICE" }
        : { state: "ACCOUNT_NEWER", winner: "ACCOUNT" };
    }

    const sameIdentity = Boolean(localRecord.id && remoteRecord.id && localRecord.id === remoteRecord.id);
    const sameMetadata = sameDescriptorIdentity;
    if (sameMetadata && Boolean(localRecord.payload) !== Boolean(remoteRecord.payload)) {
      return localRecord.payload
        ? { state: "DEVICE_NEWER", winner: "DEVICE", reason: "The device carries the recoverable payload." }
        : { state: "ACCOUNT_NEWER", winner: "ACCOUNT", reason: "The account carries the recoverable payload." };
    }
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

  function normalizedDescriptor(domain, value = null) {
    if (!value) return null;
    if (!value.fingerprint) {
      const payload = Object.prototype.hasOwnProperty.call(value, "payload") ? value.payload : value;
      return recordDescriptor(domain, payload, value.options || {});
    }
    return {
      ...value,
      domain,
      fingerprint: value.payload
        ? semanticFingerprint(value.payload, { sortRootArray: value.stateType === "HISTORY" })
        : value.fingerprint
    };
  }

  function buildManifest(input = {}, options = {}) {
    const savedAt = options.savedAt || new Date().toISOString();
    const modules = {};
    CANONICAL_DOMAINS.forEach((domain) => {
      const item = input[domain];
      modules[domain] = normalizedDescriptor(domain, item);
    });
    const executions = (input.executions || []).filter(Boolean).map((item) => normalizedDescriptor(item.domain, item));
    const checkpoints = (input.checkpoints || []).filter(Boolean).map((item) => normalizedDescriptor(item.domain, item));
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

  function recordCollectionKey(item = {}) {
    return [item.domain, item.stateType, item.stateKey, item.id || "current", Number(item.revision || 0)].join(":");
  }

  function mergeRecordCollections(deviceItems = [], accountItems = []) {
    const merged = new Map();
    [...deviceItems, ...accountItems].filter(Boolean).forEach((item) => {
      const key = recordCollectionKey(item);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, item);
        return;
      }
      const comparison = compareRecords(existing, item, { immutable: false });
      if (comparison.winner === "ACCOUNT" || (comparison.state === "CONFLICT" && item.payload && !existing.payload)) merged.set(key, item);
    });
    return [...merged.values()].sort((left, right) => recordCollectionKey(left).localeCompare(recordCollectionKey(right)));
  }

  function descriptorLinkedToContract(item = null, contract = null) {
    if (!item || !contract?.id) return false;
    return item.contractId === contract.id
      && Number(item.contractRevision || 0) === Number(contract.revision || 0);
  }

  function canonicalLineage(value = {}, options = {}) {
    const manifest = normalizeManifest(value);
    const modules = manifest.modules || {};
    const effectiveIdentity = options.effectiveIdentity || null;
    let contractRecord = modules.contract || null;
    let contract = contractRecord?.payload || null;
    if (effectiveIdentity?.signedContractId) {
      contract = effectiveIdentity.signedContract || contract || {};
      contractRecord = {
        ...(contractRecord || {}),
        id: effectiveIdentity.signedContractId,
        revision: Number(effectiveIdentity.signedContractRevision || 0),
        contractRevision: Number(effectiveIdentity.signedContractRevision || 0),
        payload: contract
      };
    }
    const today = String(options.today || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const contractRevision = Number(contractRecord?.revision || contract?.revision || 0);
    const required = {
      contract: true,
      strength: contract ? Number(contract.strengthDaysPerWeek || 0) > 0 : Boolean(modules.strength),
      running: contract ? Number(contract.runningDaysPerWeek || 0) > 0 : Boolean(modules.running),
      core: contract ? Number(contract.coreDaysPerWeek || 0) > 0 : Boolean(modules.core),
      nutrition: Boolean(contractRecord),
      calendar: Boolean(contractRecord)
    };
    const states = {};
    CANONICAL_DOMAINS.forEach((domain) => {
      const item = modules[domain] || null;
      if (domain === "contract") {
        states[domain] = item ? { state: "CURRENT", required: true, revision: contractRevision } : { state: "MISSING", required: true, revision: 0 };
        return;
      }
      if (!required[domain]) {
        states[domain] = { state: "NOT_REQUIRED", required: false, revision: Number(item?.revision || 0) };
        return;
      }
      if (!item) {
        states[domain] = { state: "MISSING", required: true, revision: 0 };
        return;
      }
      const linkedToEffectiveContract = Boolean(effectiveIdentity?.signedContractRevision
        && Number(item.contractRevision || item.payload?.contractRevision || 0) === Number(effectiveIdentity.signedContractRevision));
      if (descriptorLinkedToContract(item, contractRecord) || linkedToEffectiveContract) {
        states[domain] = { state: "CURRENT", required: true, revision: Number(item.revision || 0) };
        return;
      }
      if (domain === "calendar") {
        const week = item.payload || {};
        const protectedCurrentWeek = week.status !== "REPLACED"
          && week.weekStart && week.weekEnd && week.weekStart <= today && week.weekEnd >= today;
        if (protectedCurrentWeek) {
          states[domain] = { state: "PROTECTED_CURRENT_WEEK", required: true, revision: Number(item.revision || 0), contractRevision: Number(item.contractRevision || 0) };
          return;
        }
      }
      states[domain] = { state: "STALE", required: true, revision: Number(item.revision || 0), contractRevision: Number(item.contractRevision || 0) };
    });
    const requiredStates = Object.values(states).filter((item) => item.required);
    const stale = Object.entries(states).filter(([, item]) => item.required && ["STALE", "MISSING"].includes(item.state)).map(([domain]) => domain);
    const protectedWeek = states.calendar?.state === "PROTECTED_CURRENT_WEEK";
    const status = !contractRecord ? "CONTRACT_REQUIRED" : stale.length ? "ACTION_REQUIRED" : protectedWeek ? "TRANSITION" : "READY";
    const headline = status === "READY"
      ? `Contract R${contractRevision} runs the active program.`
      : status === "TRANSITION"
        ? `This week stays protected; the next week must use Contract R${contractRevision}.`
        : status === "CONTRACT_REQUIRED"
          ? "A signed Contract is required."
          : `${stale.map((domain) => domain[0].toUpperCase() + domain.slice(1)).join(", ")} must be linked to Contract R${contractRevision}.`;
    return {
      version: VERSION,
      status,
      contractId: contractRecord?.id || null,
      contractRevision,
      canonicalKey: contractRecord?.id ? `${contractRecord.id}:r${contractRevision}` : null,
      modules: states,
      staleDomains: stale,
      protectedWeek,
      draftUnchanged: effectiveIdentity?.draftUnchanged === true,
      draftHasMaterialChanges: effectiveIdentity?.draftHasMaterialChanges === true,
      completeCount: requiredStates.filter((item) => ["CURRENT", "PROTECTED_CURRENT_WEEK"].includes(item.state)).length,
      requiredCount: requiredStates.length,
      headline
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
      const comparison = compareRecords(device.modules[domain], account.modules[domain], {
        immutable: Boolean(device.modules[domain]?.immutable ?? account.modules[domain]?.immutable)
      });
      if (comparison.state === "CONFLICT") {
        conflicts.push({
          key: recordCollectionKey(device.modules[domain] || account.modules[domain] || { domain }),
          domain,
          stateType: device.modules[domain]?.stateType || account.modules[domain]?.stateType || "ACTIVE",
          stateKey: device.modules[domain]?.stateKey || account.modules[domain]?.stateKey || "current",
          device: device.modules[domain],
          account: account.modules[domain],
          reason: comparison.reason
        });
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
    const merged = buildManifest({
      ...modules,
      executions: mergeRecordCollections(device.executions, account.executions),
      checkpoints: mergeRecordCollections(device.checkpoints, account.checkpoints),
      snapshots
    }, {
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
    if (code === "SYNCED" || code === "MATCHED") return {
      code: "SYNCED",
      label: "SAVED & SYNCED",
      detail: options.lineage?.status === "TRANSITION" ? options.lineage.headline : "Your account and this device match.",
      tone: "green"
    };
    if (code === "CONFLICT") return { code, label: "CHOICE NEEDED", detail: `${options.conflictCount || 1} same-revision difference${Number(options.conflictCount || 1) === 1 ? "" : "s"} need your choice.`, tone: "red" };
    if (code === "PENDING") return { code, label: "SAVED ON DEVICE", detail: `${options.pendingCount || 1} account save${Number(options.pendingCount || 1) === 1 ? " is" : "s are"} queued to retry.`, tone: "yellow" };
    if (code === "REPAIRING") return { code, label: "REPAIRING", detail: "Applying your choice and verifying the complete program chain.", tone: "neutral" };
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
    canonicalizePayload,
    semanticFingerprint,
    timestamp,
    identity,
    revision,
    recordDescriptor,
    snapshotDescriptor,
    normalizeSnapshots,
    compareSnapshots,
    compareRecords,
    mergeRecordCollections,
    buildManifest,
    normalizeManifest,
    reconcileManifests,
    descriptorLinkedToContract,
    canonicalLineage,
    withSnapshot,
    snapshotPayload,
    syncPresentation
  });
});
