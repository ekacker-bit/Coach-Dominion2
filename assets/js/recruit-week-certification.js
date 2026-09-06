(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRecruitWeekCertification = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031G.1";
  const RECEIPT_TYPE = "RECRUIT_WEEK_CERTIFICATION";
  const DAY_MS = 86400000;
  const STATES = Object.freeze({
    IN_PROGRESS: "IN_PROGRESS",
    ACTION_REQUIRED: "ACTION_REQUIRED",
    PROTECTED: "PROTECTED",
    READY_TO_SAVE: "READY_TO_SAVE",
    VERIFIED: "VERIFIED"
  });

  function clean(value = "") {
    return String(value == null ? "" : value).trim();
  }

  function isoDate(value = "") {
    const candidate = clean(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
  }

  function ordinal(value = "") {
    const date = isoDate(value);
    if (!date) return null;
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / DAY_MS;
  }

  function addDays(value, amount = 0) {
    const day = ordinal(value);
    if (day === null) return null;
    return new Date((day + Number(amount || 0)) * DAY_MS).toISOString().slice(0, 10);
  }

  function stableSerialize(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  function stableHash(value = "") {
    const text = typeof value === "string" ? value : stableSerialize(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function values(value) {
    return Array.isArray(value) ? value : value == null ? [] : [value];
  }

  function authority(value = {}) {
    const source = value.authority || value;
    return Object.freeze({
      contractRevision: Number(source.contractRevision || 0),
      programId: clean(source.programId),
      weekId: clean(source.weekId || source.sourceWeekId),
      weekStartDate: isoDate(source.weekStartDate || source.weekStart || source.sourceWeekStart),
      weekEndDate: isoDate(source.weekEndDate || source.weekEnd || source.sourceWeekEnd)
    });
  }

  function validAuthority(value = {}) {
    const expected = authority(value);
    const start = ordinal(expected.weekStartDate);
    const end = ordinal(expected.weekEndDate);
    return Boolean(
      expected.contractRevision > 0
      && expected.programId
      && expected.weekId
      && start !== null
      && end !== null
      && end - start === 6
    );
  }

  function authorityMatches(left = {}, right = {}) {
    const expected = authority(left);
    const actual = authority(right);
    return expected.contractRevision === actual.contractRevision
      && expected.programId === actual.programId
      && expected.weekId === actual.weekId
      && expected.weekStartDate === actual.weekStartDate
      && expected.weekEndDate === actual.weekEndDate;
  }

  function action(value = {}, fallback = {}) {
    const source = typeof value === "string" ? { code: value } : value || {};
    return Object.freeze({
      code: clean(source.code || fallback.code || "OPEN_REVIEW"),
      label: clean(source.label || fallback.label || "Open Review"),
      section: clean(source.section || fallback.section || "inspection"),
      operatingDate: isoDate(source.operatingDate || fallback.operatingDate),
      detail: clean(source.detail || fallback.detail)
    });
  }

  function stage(id, state, detail, next = null, code = null) {
    return Object.freeze({ id, state, detail: clean(detail), action: next, code: clean(code || next?.code) || null });
  }

  function receiptTime(receipt = {}) {
    const parsed = Date.parse(receipt.accountConfirmedAt || receipt.observedAt || receipt.updatedAt || receipt.createdAt || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function receiptFor(receipts = [], candidate = null) {
    return values(receipts)
      .filter((item) => item?.type === RECEIPT_TYPE && item?.id === candidate?.id && item?.fingerprint === candidate?.fingerprint)
      .sort((left, right) => receiptTime(right) - receiptTime(left))[0] || null;
  }

  function appendReceipt(receipts = [], receipt = null, limit = 120) {
    const merged = new Map();
    [...values(receipts), receipt].filter((item) => item?.id).forEach((item) => {
      const current = merged.get(item.id);
      if (!current || receiptTime(item) > receiptTime(current)) merged.set(item.id, item);
    });
    return [...merged.values()]
      .sort((left, right) => receiptTime(right) - receiptTime(left) || clean(left.id).localeCompare(clean(right.id)))
      .slice(0, Math.max(1, Number(limit || 120)));
  }

  function launchMatches(expected = {}, proofWeek = null, launch = null, targetWeek = null) {
    const receipt = launch?.candidate || null;
    if (!receipt || launch?.state !== "VERIFIED" || !proofWeek?.candidate?.id) return false;
    const targetWeekId = clean(targetWeek?.id);
    return clean(receipt.proofWeekReceiptId) === clean(proofWeek.candidate.id)
      && clean(receipt.sourceWeekId) === expected.weekId
      && isoDate(receipt.sourceWeekStart) === expected.weekStartDate
      && isoDate(receipt.sourceWeekEnd) === expected.weekEndDate
      && Number(receipt.contractRevision || 0) === expected.contractRevision
      && clean(receipt.programId) === expected.programId
      && clean(receipt.targetWeekId) === targetWeekId
      && clean(targetWeek?.status).toUpperCase() === "COMMITTED"
      && isoDate(targetWeek?.weekStart) === addDays(expected.weekEndDate, 1);
  }

  function buildReceipt(input = {}) {
    const expected = authority(input.authority);
    const proofWeek = input.proofWeek || null;
    const inspection = input.inspection || null;
    const launch = input.weeklyLaunch || null;
    const targetWeek = input.targetWeek || null;
    if (!validAuthority(expected) || proofWeek?.state !== "VERIFIED" || !proofWeek?.candidate?.id) return null;
    if (!inspection?.finalizedAt || isoDate(inspection.weekStartDate) !== expected.weekStartDate || isoDate(inspection.weekEndDate) !== expected.weekEndDate) return null;
    if (!authorityMatches(expected, proofWeek.authority || proofWeek.candidate.authority || {})) return null;
    if (!launchMatches(expected, proofWeek, launch, targetWeek)) return null;
    const dailyReceiptIds = values(proofWeek.candidate.dailyReceiptIds).map(clean).filter(Boolean);
    if (dailyReceiptIds.length !== 7 || new Set(dailyReceiptIds).size !== 7) return null;
    const launchReceipt = launch.candidate;
    const proof = Object.freeze({
      proofWeekReceiptId: proofWeek.candidate.id,
      dailyReceiptIds: Object.freeze(dailyReceiptIds),
      inspectionId: clean(inspection.id || inspection.inspectionId || `weekly-inspection:${expected.weekStartDate}`),
      inspectionFinalizedAt: clean(inspection.finalizedAt),
      weeklyLaunchReceiptId: launchReceipt.id,
      calendarReceiptId: clean(launchReceipt.calendarReceiptId),
      targetWeekId: clean(targetWeek.id),
      targetWeekStart: isoDate(targetWeek.weekStart)
    });
    const basis = { authority: expected, proof };
    const fingerprint = stableHash(basis);
    return Object.freeze({
      id: `recruit-week-certification:${expected.weekStartDate}:${proof.targetWeekStart}:${fingerprint}`,
      type: RECEIPT_TYPE,
      schemaVersion: VERSION,
      fingerprint,
      authority: expected,
      proof,
      observedAt: clean(input.observedAt || new Date().toISOString())
    });
  }

  function evaluate(input = {}) {
    const expected = authority(input.authority);
    const proofWeek = input.proofWeek || null;
    const inspection = input.inspection || null;
    const launch = input.weeklyLaunch || null;
    const targetWeek = input.targetWeek || null;
    const account = input.account || {};
    const pendingWrites = Math.max(0, Number(account.pendingWrites || input.pendingWrites || 0));
    const stages = [];

    if (!clean(input.userId)) {
      stages.push(stage("account", "ACTION_REQUIRED", "Sign in to secure this week to your account.", action({ code: "SIGN_IN", label: "Sign in", section: "today" }), "ACCOUNT_REQUIRED"));
    } else if (account.online === false || pendingWrites || account.serverConfirmed !== true) {
      stages.push(stage("account", "PROTECTED", account.online === false ? "This week is protected on this device until you are online." : "Your account is confirming the latest proof.", null, "ACCOUNT_CONFIRMATION_PENDING"));
    } else {
      stages.push(stage("account", "CURRENT", "Account confirmation is current."));
    }

    if (!validAuthority(expected)) {
      stages.push(stage("authority", "ACTION_REQUIRED", "The signed Contract and committed week do not share one complete identity.", action({ code: "OPEN_CONTRACT", label: "Review Contract", section: "contract" }), "AUTHORITY_INCOMPLETE"));
    } else {
      stages.push(stage("authority", "CURRENT", "The signed Contract and committed week agree."));
    }

    if (proofWeek?.repair) {
      stages.push(stage("dailyProof", "ACTION_REQUIRED", proofWeek.repair.detail || "One day needs review.", action(proofWeek.repair, { label: "Review day", section: "today" }), proofWeek.repair.code || "DAILY_PROOF_REPAIR"));
    } else if (proofWeek?.state === "VERIFIED" && proofWeek?.candidate?.id) {
      if (authorityMatches(expected, proofWeek.authority || proofWeek.candidate.authority || {})) {
        stages.push(stage("dailyProof", "CURRENT", "All seven days are confirmed by this account."));
      } else {
        stages.push(stage("dailyProof", "ACTION_REQUIRED", "The seven-day proof belongs to a different signed week.", action({ code: "OPEN_REVIEW", label: "Review week", section: "inspection" }), "PROOF_AUTHORITY_MISMATCH"));
      }
    } else if (["PROTECTED", "READY_TO_SAVE"].includes(clean(proofWeek?.state).toUpperCase())) {
      stages.push(stage("dailyProof", "PROTECTED", proofWeek?.detail || "Daily proof is still securing to the account.", null, "DAILY_PROOF_PENDING"));
    } else {
      stages.push(stage("dailyProof", "OPEN", proofWeek?.detail || "Complete each day to build the seven-day proof.", action({ code: "OPEN_TODAY", label: "Continue the week", section: "today" }), "DAILY_PROOF_OPEN"));
    }

    const proofReady = stages.find((item) => item.id === "dailyProof")?.state === "CURRENT";
    if (!proofReady) {
      stages.push(stage("inspection", "WAITING", "Weekly judgment waits for seven confirmed days."));
    } else if (!inspection?.finalizedAt) {
      stages.push(stage("inspection", "ACTION_REQUIRED", "Seven days are secure. Lock the weekly result.", action({ code: "FINALIZE_WEEK", label: "Finalize week", section: "inspection" }), "INSPECTION_NOT_FINALIZED"));
    } else if (isoDate(inspection.weekStartDate) !== expected.weekStartDate || isoDate(inspection.weekEndDate) !== expected.weekEndDate) {
      stages.push(stage("inspection", "ACTION_REQUIRED", "The finalized result belongs to a different week.", action({ code: "OPEN_REVIEW", label: "Review week", section: "inspection" }), "INSPECTION_DATE_MISMATCH"));
    } else {
      stages.push(stage("inspection", "CURRENT", "The weekly result is finalized."));
    }

    const inspectionReady = stages.find((item) => item.id === "inspection")?.state === "CURRENT";
    if (!inspectionReady) {
      stages.push(stage("launch", "WAITING", "Next week waits for the finalized result."));
    } else if (["PROTECTED", "READY_TO_SAVE"].includes(clean(launch?.state).toUpperCase())) {
      stages.push(stage("launch", "PROTECTED", launch?.detail || "The next week is securing to the account.", null, "NEXT_WEEK_PENDING"));
    } else if (launch?.state !== "VERIFIED") {
      const next = action(launch?.primaryAction, { code: "APPROVE_NEXT_WEEK", label: "Approve next week", section: "inspection" });
      stages.push(stage("launch", "ACTION_REQUIRED", launch?.detail || "Approve the coordinated next week.", next, next.code || "NEXT_WEEK_NOT_LAUNCHED"));
    } else if (!launchMatches(expected, proofWeek, launch, targetWeek)) {
      stages.push(stage("launch", "ACTION_REQUIRED", "The launched Calendar does not match this signed week and verdict.", action({ code: "OPEN_CALENDAR", label: "Review Calendar", section: "calendar" }), "LAUNCH_LINEAGE_MISMATCH"));
    } else {
      stages.push(stage("launch", "CURRENT", "The exact next week is committed and account-confirmed."));
    }

    const firstProblem = stages.find((item) => item.state === "ACTION_REQUIRED") || null;
    const protectedStage = stages.find((item) => item.state === "PROTECTED") || null;
    const candidate = firstProblem ? null : buildReceipt(input);
    const localExact = Boolean(receiptFor(input.localReceipts, candidate));
    const accountExact = Boolean(receiptFor(input.accountReceipts, candidate));
    const serverConfirmed = account.serverConfirmed === true && Boolean(account.lastVerifiedAt || account.confirmedMutationId || account.confirmedFingerprint);
    let state = STATES.IN_PROGRESS;
    let tone = "neutral";
    let label = "WEEK IN PROGRESS";
    let detail = proofWeek?.detail || "Complete the week one day at a time.";
    let primaryAction = stages.find((item) => item.state === "OPEN" && item.action)?.action || action({ code: "OPEN_TODAY", label: "Continue the week", section: "today" });
    let shouldSave = false;

    if (firstProblem) {
      state = STATES.ACTION_REQUIRED;
      tone = "red";
      label = "ONE STEP LEFT";
      detail = firstProblem.detail;
      primaryAction = firstProblem.action;
    } else if (candidate && accountExact && serverConfirmed && pendingWrites === 0) {
      state = STATES.VERIFIED;
      tone = "green";
      label = "WEEK SECURED";
      detail = `Seven days are confirmed. Next week begins ${candidate.proof.targetWeekStart}.`;
      primaryAction = action({ code: "OPEN_NEXT_WEEK", label: "Open next week", section: "calendar" });
    } else if (candidate && !localExact && account.online !== false && pendingWrites === 0) {
      state = STATES.READY_TO_SAVE;
      tone = "yellow";
      label = "SECURING WEEK";
      detail = "The complete week is ready for its final account receipt.";
      primaryAction = null;
      shouldSave = true;
    } else if (candidate && localExact && (!accountExact || !serverConfirmed) && account.online !== false && pendingWrites === 0) {
      state = STATES.PROTECTED;
      tone = "yellow";
      label = "SAVED HERE";
      detail = "The complete week is safe on this device but still needs account confirmation.";
      primaryAction = action({ code: "RETRY_ACCOUNT", label: "Retry account save", section: "inspection" });
    } else if (protectedStage || pendingWrites || account.online === false || (candidate && localExact)) {
      state = STATES.PROTECTED;
      tone = "yellow";
      label = account.online === false ? "SAVED HERE" : "SECURING WEEK";
      detail = protectedStage?.detail || "The completed week is protected while the account confirms it.";
      primaryAction = account.online === false ? action({ code: "RETRY_ACCOUNT", label: "Retry when online", section: "inspection" }) : null;
    }

    const diagnosticBasis = {
      state,
      authority: expected,
      stages: stages.map((item) => ({ id: item.id, state: item.state, code: item.code })),
      candidateId: candidate?.id || null,
      localExact,
      accountExact,
      pendingWrites
    };
    const diagnostic = Object.freeze({
      code: `WG-${stableHash(diagnosticBasis).toUpperCase()}`,
      firstStage: firstProblem?.id || protectedStage?.id || stages.find((item) => item.state !== "CURRENT")?.id || null,
      stageStates: Object.freeze(Object.fromEntries(stages.map((item) => [item.id, item.state]))),
      fingerprint: stableHash(diagnosticBasis)
    });

    return Object.freeze({
      version: VERSION,
      type: RECEIPT_TYPE,
      state,
      tone,
      label,
      detail,
      verified: state === STATES.VERIFIED,
      protected: state === STATES.PROTECTED,
      shouldSave,
      primaryAction,
      firstProblem,
      stages: Object.freeze(stages),
      candidate,
      localExact,
      accountExact,
      pendingWrites,
      diagnostic
    });
  }

  return Object.freeze({
    VERSION,
    RECEIPT_TYPE,
    STATES,
    isoDate,
    addDays,
    stableSerialize,
    stableHash,
    authority,
    validAuthority,
    authorityMatches,
    launchMatches,
    buildReceipt,
    receiptFor,
    appendReceipt,
    evaluate
  });
});
