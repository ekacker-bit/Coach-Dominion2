(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionContractReconciliation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "029N.1";
  const FIELD_DEFINITIONS = Object.freeze([
    ["primaryGoal", "Primary goal"],
    ["target", "Outcome"],
    ["targetDate", "Target date"],
    ["trainingDaysPerWeek", "Training days / week"],
    ["strengthDaysPerWeek", "Strength days / week"],
    ["runningDaysPerWeek", "Cardio days / week"],
    ["coreDaysPerWeek", "Core days / week"],
    ["sessionMinutes", "Minutes / session"],
    ["twoADays", "Two-a-Days"],
    ["declaredWeeklyDistance", "Weekly distance"],
    ["nutritionCommitment", "Fuel commitment"],
    ["weight", "Body weight"],
    ["weightLbs", "Body weight"],
    ["age", "Age"],
    ["heightCm", "Height"],
    ["gender", "Gender"],
    ["trainingYears", "Training history"]
  ]);
  const PLAN_FIELDS = new Set([
    "primaryGoal", "target", "targetDate", "trainingDaysPerWeek", "strengthDaysPerWeek",
    "runningDaysPerWeek", "coreDaysPerWeek", "sessionMinutes", "twoADays",
    "declaredWeeklyDistance", "age", "heightCm", "gender", "trainingYears"
  ]);
  const FUEL_FIELDS = new Set(["primaryGoal", "nutritionCommitment", "weight", "weightLbs", "age", "heightCm", "gender"]);
  const VOLATILE_KEYS = new Set([
    "updatedAt", "updated_at", "savedAt", "saved_at", "syncedAt", "synced_at",
    "capturedAt", "captured_at", "lastViewedAt", "last_viewed_at"
  ]);

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function canonicalize(value) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(canonicalize);
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !VOLATILE_KEYS.has(key))
      .map(([key, item]) => [key, canonicalize(item)]));
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const source = stableSerialize(canonicalize(value));
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function shortHash(value) {
    return String(typeof value === "string" ? value : fingerprint(value)).replace(/^fnv1a-/, "").slice(0, 8).toUpperCase();
  }

  function unwrap(value) {
    return value?.payload && typeof value.payload === "object" ? value.payload : value || null;
  }

  function fieldValue(payload, key) {
    if (!payload) return null;
    if (payload[key] !== undefined) return payload[key];
    if (["age", "heightCm", "gender", "trainingYears"].includes(key)) return payload.athleteProfile?.[key] ?? null;
    return null;
  }

  function valuesEqual(left, right) {
    return stableSerialize(canonicalize(left)) === stableSerialize(canonicalize(right));
  }

  function displayValue(value) {
    if (value === null || value === undefined || value === "") return "Not set";
    if (value === true) return "Enabled";
    if (value === false) return "Not enabled";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
    return String(value).replaceAll("_", " ");
  }

  function contractFieldDiffs(deviceValue, accountValue) {
    const device = unwrap(deviceValue) || {};
    const account = unwrap(accountValue) || {};
    const seenLabels = new Set();
    return FIELD_DEFINITIONS.reduce((diffs, [key, label]) => {
      const deviceField = fieldValue(device, key);
      const accountField = fieldValue(account, key);
      if (valuesEqual(deviceField, accountField) || (seenLabels.has(label) && [deviceField, accountField].every((item) => item === null))) return diffs;
      seenLabels.add(label);
      diffs.push({ key, label, device: clone(deviceField), account: clone(accountField), deviceText: displayValue(deviceField), accountText: displayValue(accountField) });
      return diffs;
    }, []);
  }

  function candidate(value, source, fallbackUpdatedAt = null) {
    const payload = unwrap(value);
    const hash = fingerprint(payload || {});
    return {
      source,
      label: source === "ACCOUNT" ? "Account copy" : "This device",
      payload: clone(payload),
      revision: Number(payload?.revision || value?.revision || 0),
      updatedAt: value?.updatedAt || value?.updated_at || payload?.updatedAt || payload?.approvedAt || fallbackUpdatedAt || null,
      origin: value?.deviceId || value?.device_id || value?.source || source,
      hash,
      shortHash: shortHash(hash)
    };
  }

  function impactForDiffs(diffs = []) {
    const keys = new Set(diffs.map((item) => item.key));
    const plans = [...keys].some((key) => PLAN_FIELDS.has(key));
    const fuel = [...keys].some((key) => FUEL_FIELDS.has(key));
    return {
      plans: plans ? ["Strength", "Cardio", "Core"] : [],
      calendar: plans ? "Active week stays protected; the next week is recalculated." : "No calendar change expected.",
      fuel: fuel ? "Calorie and macro targets are recalculated." : "Current Fuel targets are unchanged.",
      campaign: keys.has("target") || keys.has("targetDate") || keys.has("primaryGoal") ? "Campaign objective and opening week are recalculated." : "Campaign objective is unchanged."
    };
  }

  function buildPreview(conflict = {}, context = {}) {
    const device = candidate(conflict.device, "DEVICE", conflict.deviceUpdatedAt || null);
    const account = candidate(conflict.account, "ACCOUNT", conflict.accountUpdatedAt || null);
    const isContract = String(conflict.domain || "").toLowerCase() === "contract";
    const diffs = isContract ? contractFieldDiffs(device.payload, account.payload) : [];
    const impact = impactForDiffs(diffs);
    const protectedEvidenceCount = Math.max(0, Number(context.protectedEvidenceCount || 0));
    return {
      version: VERSION,
      choiceKey: conflict.choiceKey || conflict.key || null,
      domain: String(conflict.domain || "program").toLowerCase(),
      title: isContract ? `Contract revision ${Math.max(device.revision, account.revision) || "—"}` : `${conflict.domain || "Program"} saved difference`,
      reason: conflict.reason || "The same approved revision contains different contents.",
      device,
      account,
      diffs,
      impact,
      protectedEvidenceCount,
      protectedEvidence: protectedEvidenceCount
        ? `${protectedEvidenceCount} completed evidence item${protectedEvidenceCount === 1 ? " is" : "s are"} preserved whichever copy you choose.`
        : "Completed evidence remains protected whichever copy you choose.",
      consequences: {
        DEVICE: device.hash === account.hash ? "Confirms this device with no new revision." : `Makes this device canonical as a new immutable revision ${Math.max(device.revision, account.revision) + 1}.`,
        ACCOUNT: "Restores the account copy on this device without rewriting its approved revision."
      },
      previewed: context.previewed === true
    };
  }

  function resolutionReceipt(input = {}) {
    const selected = input.selected;
    const rejected = input.rejected;
    const resolvedAt = input.resolvedAt || new Date().toISOString();
    const resultRevision = Number(input.resultRevision || selected?.revision || 0);
    const identity = fingerprint({
      choiceKey: input.choiceKey,
      selected: selected?.hash,
      rejected: rejected?.hash,
      resultRevision,
      resolvedAt
    });
    return {
      id: `contract-reconciliation-${shortHash(identity)}`,
      receiptId: `contract-reconciliation-${shortHash(identity)}`,
      type: "CONTRACT_RECONCILIATION",
      status: "RECONCILED",
      choiceKey: input.choiceKey || null,
      selectedSource: selected?.source || null,
      selectedHash: selected?.hash || null,
      rejectedSource: rejected?.source || null,
      rejectedHash: rejected?.hash || null,
      priorRevision: Math.max(Number(selected?.revision || 0), Number(rejected?.revision || 0)),
      resultRevision,
      canonicalChanged: input.canonicalChanged === true,
      resolvedAt,
      downstream: {
        plans: "RECALCULATE",
        calendar: "ACTIVE_WEEK_PROTECTED_NEXT_WEEK_RECALCULATE",
        fuel: "RECALCULATE_IF_AFFECTED",
        campaign: "RECONCILE"
      },
      evidence: {
        policy: "PRESERVED",
        protectedCount: Math.max(0, Number(input.protectedEvidenceCount || 0))
      }
    };
  }

  function reconcileContract(conflict = {}, preference = "ACCOUNT", options = {}) {
    const device = candidate(conflict.device, "DEVICE", conflict.deviceUpdatedAt || null);
    const account = candidate(conflict.account, "ACCOUNT", conflict.accountUpdatedAt || null);
    const selected = preference === "DEVICE" ? device : account;
    const rejected = preference === "DEVICE" ? account : device;
    if (!selected.payload) throw new Error("The selected Contract copy is unavailable.");
    const canonicalChanged = selected.hash !== account.hash;
    const nextRevision = canonicalChanged ? Math.max(device.revision, account.revision) + 1 : selected.revision;
    const canonical = clone(selected.payload);
    if (canonicalChanged) {
      canonical.revision = nextRevision;
      canonical.id = `${String(canonical.id || "contract").replace(/-r\d+(?:-[a-f0-9]+)?$/i, "")}-r${nextRevision}-${shortHash(selected.hash).toLowerCase()}`;
      canonical.reconciledFromRevision = selected.revision;
      canonical.reconciledAt = options.resolvedAt || new Date().toISOString();
      canonical.reconciliationSource = selected.source;
      if (canonical.signature && typeof canonical.signature === "object") {
        canonical.signature = { ...canonical.signature, contractRevision: nextRevision, reconciliationConfirmed: true };
      }
    }
    const receipt = resolutionReceipt({
      choiceKey: conflict.choiceKey || conflict.key,
      selected,
      rejected,
      resultRevision: nextRevision,
      canonicalChanged,
      resolvedAt: options.resolvedAt,
      protectedEvidenceCount: options.protectedEvidenceCount
    });
    canonical.reconciliationReceiptId = receipt.id;
    return { version: VERSION, canonical, receipt, selected, rejected, canonicalChanged, resultRevision: nextRevision };
  }

  function executionPolicy(conflicts = []) {
    const contractConflict = (Array.isArray(conflicts) ? conflicts : []).find((item) => String(item?.domain || "").toLowerCase() === "contract");
    if (!contractConflict) return { blocked: false, rawEvidenceAllowed: true, progressionAllowed: true };
    return {
      blocked: true,
      code: "CONTRACT_CONFLICT",
      state: "CONFLICT_REQUIRES_CHOICE",
      headline: "Resolve saved Contract",
      detail: "Mission protected. Plan-derived training, progression, and targets wait until one Contract copy governs the program.",
      action: { action: "RESOLVE_CONTINUITY", label: "Compare and choose saved Contract", section: "today", module: "continuity" },
      rawEvidenceAllowed: true,
      progressionAllowed: false,
      provisionalMission: true,
      hideCountdown: true,
      fuelTargetsProvisional: true
    };
  }

  function allPreviewed(previews = []) {
    return previews.length > 0 && previews.every((item) => item.previewed === true);
  }

  return Object.freeze({
    VERSION,
    FIELD_DEFINITIONS: FIELD_DEFINITIONS.map((item) => [...item]),
    stableSerialize,
    canonicalize,
    fingerprint,
    shortHash,
    contractFieldDiffs,
    impactForDiffs,
    buildPreview,
    resolutionReceipt,
    reconcileContract,
    executionPolicy,
    allPreviewed
  });
});
