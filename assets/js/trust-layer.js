(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DominionTrustLayer = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const VERSION = "028A.1";
  const RELIABILITY_VERSION = "029L.1";
  const SAFE_ISSUES = new Set([
    "ACCOUNT_RETRY_REQUIRED",
    "ACCOUNT_SAVE_QUEUED",
    "PROGRAM_FINGERPRINT_MISMATCH",
    "TODAY_DECISION_MISSING",
    "TODAY_DECISION_INCONSISTENT",
    "STARTUP_RECOVERED"
  ]);
  const USER_ISSUES = new Set([
    "CONTRACT_REQUIRED",
    "PROGRAM_REQUIRED",
    "CALENDAR_REQUIRED",
    "PROGRAM_CONFLICT"
  ]);
  const SAFE_ROUTES = new Set(["app", "today", "performance", "calendar", "nutrition", "program", "inspection", "contract", "connected", "more", "runtime", "promise"]);

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeStatus(value) {
    return clean(value || "CHECKING").toUpperCase().replaceAll(" ", "_");
  }

  function count(value) {
    return Math.max(0, Number(value || 0));
  }

  function lineageState(lineage, key) {
    const direct = lineage?.[key];
    const moduleState = lineage?.modules?.[key];
    const collection = Array.isArray(lineage?.items) ? lineage.items.find((item) => clean(item?.id || item?.key).toLowerCase() === key) : null;
    if (key === "plans" && lineage?.modules) {
      const required = Object.entries(lineage.modules).filter(([domain, state]) => !["contract", "calendar"].includes(domain) && state?.required !== false);
      return required.length && required.every(([, state]) => lineageHealthy(state?.state || state?.status)) ? "CURRENT" : "MISSING";
    }
    return normalizeStatus(direct?.status || direct?.state || moduleState?.status || moduleState?.state || collection?.status || collection?.state || "MISSING");
  }

  function lineageHealthy(state) {
    return ["CURRENT", "READY", "VERIFIED", "NOT_REQUIRED", "PROTECTED_CURRENT_WEEK"].includes(normalizeStatus(state));
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function boundedCount(value, max = 999999) {
    return Math.min(max, count(value));
  }

  function reliabilitySeverity(event, context = {}) {
    const normalizedEvent = clean(event).toLowerCase();
    const attempt = Math.max(count(context.attempt), count(context.retryCount));
    const oldestQueuedAgeMs = boundedCount(context.oldestQueuedAgeMs, 7 * 24 * 60 * 60 * 1000);
    if (["runtime_error", "repair_failed", "sync_failed"].includes(normalizedEvent)) return "error";
    if (normalizedEvent === "retry_failed") return attempt >= 3 || oldestQueuedAgeMs >= 5 * 60 * 1000 ? "error" : "warning";
    if (normalizedEvent === "conflict_detected") return "warning";
    if (normalizedEvent === "save_queued" && (boundedCount(context.pendingWrites) >= 3 || oldestQueuedAgeMs >= 2 * 60 * 1000)) return "warning";
    return "info";
  }

  function actionForIssues(issues) {
    if (issues.includes("PROGRAM_CONFLICT")) return { code: "CHOOSE_SAVED_COPY", label: "Choose saved copy", section: "more" };
    if (issues.includes("CONTRACT_REQUIRED")) return { code: "OPEN_CONTRACT", label: "Open Contract", section: "contract" };
    if (issues.includes("PROGRAM_REQUIRED")) return { code: "REBUILD_PROGRAM", label: "Build program", section: "contract" };
    if (issues.includes("CALENDAR_REQUIRED")) return { code: "OPEN_CALENDAR", label: "Open Calendar", section: "calendar" };
    return null;
  }

  function evaluate(input = {}) {
    const online = input.online !== false;
    const accountStatus = normalizeStatus(input.accountHealth?.status || input.accountHealth?.mode);
    const pendingWrites = count(input.pendingWrites) + count(input.accountHealth?.pendingWrites);
    const conflicts = count(input.conflicts?.length || input.conflicts);
    const lineage = input.lineage || {};
    const contractState = lineageState(lineage, "contract");
    const planState = lineageState(lineage, "plans");
    const calendarState = lineageState(lineage, "calendar");
    const decisionExists = Boolean(input.decision?.id || input.decision?.operatingDate);
    const decisionConsistent = input.decisionConsistency !== false;
    const localFingerprint = clean(input.programFingerprint);
    const accountFingerprint = clean(input.accountProgramFingerprint);
    const fingerprintMismatch = Boolean(localFingerprint && accountFingerprint && localFingerprint !== accountFingerprint);
    const startupIssues = Array.isArray(input.startupIssues) ? input.startupIssues : [];
    const issues = [];

    if (!lineageHealthy(contractState)) issues.push("CONTRACT_REQUIRED");
    if (lineageHealthy(contractState) && !lineageHealthy(planState)) issues.push("PROGRAM_REQUIRED");
    if (lineageHealthy(contractState) && lineageHealthy(planState) && !lineageHealthy(calendarState)) issues.push("CALENDAR_REQUIRED");
    if (conflicts) issues.push("PROGRAM_CONFLICT");
    if (fingerprintMismatch) issues.push("PROGRAM_FINGERPRINT_MISMATCH");
    if (!decisionExists) issues.push("TODAY_DECISION_MISSING");
    else if (!decisionConsistent) issues.push("TODAY_DECISION_INCONSISTENT");
    if (["RETRY_REQUIRED", "SAVE_QUEUED"].includes(accountStatus)) issues.push(accountStatus === "RETRY_REQUIRED" ? "ACCOUNT_RETRY_REQUIRED" : "ACCOUNT_SAVE_QUEUED");
    if (startupIssues.length) issues.push("STARTUP_RECOVERED");

    const issueCodes = unique(issues);
    const userIssues = issueCodes.filter((code) => USER_ISSUES.has(code));
    const repairableIssues = issueCodes.filter((code) => SAFE_ISSUES.has(code));
    const repairActions = unique(repairableIssues.flatMap((code) => {
      if (["ACCOUNT_RETRY_REQUIRED", "ACCOUNT_SAVE_QUEUED", "STARTUP_RECOVERED"].includes(code)) return ["RETRY_SAVED_WORK"];
      if (code === "PROGRAM_FINGERPRINT_MISMATCH") return ["SYNC_ACCOUNT_STATE"];
      if (["TODAY_DECISION_MISSING", "TODAY_DECISION_INCONSISTENT"].includes(code)) return ["REBUILD_TODAY"];
      return [];
    }));

    let status = "VERIFIED";
    let tone = "green";
    let headline = "Program verified";
    let detail = "Your plan, calendar, Today order, and saved evidence agree.";
    if (userIssues.length) {
      status = "ACTION_REQUIRED";
      tone = "red";
      headline = userIssues.includes("PROGRAM_CONFLICT") ? "Choose the program to keep" : "Program needs one decision";
      detail = userIssues.includes("CONTRACT_REQUIRED") ? "Complete the Contract to establish your program."
        : userIssues.includes("PROGRAM_REQUIRED") ? "Build the approved plans that govern your week."
          : userIssues.includes("CALENDAR_REQUIRED") ? "Commit a calendar before Today can issue training."
            : "This device and your account hold different approved program states.";
    } else if (!online) {
      status = "PROTECTED";
      tone = "yellow";
      headline = "Work protected offline";
      detail = "Keep going. Saved changes will sync when the connection returns.";
    } else if (accountStatus === "LEGACY_ACTIVE" || input.accountHealth?.legacyFallback === true) {
      status = "PROTECTED";
      tone = "yellow";
      headline = "Account sync limited";
      detail = "Work remains protected on this device while account sync is unavailable.";
    } else if (pendingWrites || ["SAVE_QUEUED", "OFFLINE_PROTECTED"].includes(accountStatus)) {
      status = "PROTECTED";
      tone = "yellow";
      headline = "Work saved; sync pending";
      detail = "Nothing is lost. Account sync will retry automatically.";
    } else if (repairActions.length) {
      status = "REPAIRING";
      tone = "yellow";
      headline = "Repairing saved state";
      detail = "Account state and Today are being reconciled automatically.";
    } else if (accountStatus === "VERIFYING") {
      status = "CHECKING";
      tone = "neutral";
      headline = "Verifying your account";
      detail = "The app is waiting for an exact server receipt before calling this account current.";
    } else if (input.recovered === true || accountStatus === "RECOVERED") {
      status = "RECOVERED";
      tone = "green";
      headline = "Program restored";
      detail = "Saved account state was restored and verified.";
    } else if (!input.accountHealth?.initialized && !input.accountHealth?.lastVerifiedAt) {
      status = "CHECKING";
      tone = "neutral";
      headline = "Checking your program";
      detail = "Verifying the program from Contract through Today.";
    }

    const checks = {
      program: userIssues.some((code) => ["CONTRACT_REQUIRED", "PROGRAM_REQUIRED", "PROGRAM_CONFLICT"].includes(code)) ? "NEEDS ATTENTION" : "CURRENT",
      calendar: userIssues.includes("CALENDAR_REQUIRED") ? "NEEDS ATTENTION" : "CURRENT",
      today: issueCodes.some((code) => code.startsWith("TODAY_DECISION")) ? "REBUILDING" : "CURRENT",
      evidence: pendingWrites ? "SYNC PENDING" : "SAVED"
    };
    const fingerprint = [status, ...issueCodes, localFingerprint, accountFingerprint, pendingWrites].join("|");
    return {
      version: VERSION,
      status,
      tone,
      headline,
      detail,
      checks,
      issueCodes,
      repairActions,
      primaryAction: actionForIssues(userIssues),
      lastVerifiedAt: input.accountHealth?.lastVerifiedAt || null,
      fingerprint
    };
  }

  function telemetryPayload(event, report = {}, context = {}) {
    const allowedEvents = new Set([
      "trust_check", "repair_started", "repair_completed", "repair_failed", "runtime_error",
      "sync_started", "sync_completed", "conflict_detected", "save_queued", "queue_retry",
      "retry_succeeded", "retry_failed", "sync_failed", "startup_recovery"
    ]);
    const safeEvent = allowedEvents.has(clean(event)) ? clean(event) : "trust_check";
    const requestedRoute = clean(context.route || "app").toLowerCase();
    const attempt = boundedCount(context.attempt, 100);
    const retryCount = Math.max(attempt, boundedCount(context.retryCount, 100));
    const oldestQueuedAgeMs = boundedCount(context.oldestQueuedAgeMs, 7 * 24 * 60 * 60 * 1000);
    const operationStatus = normalizeStatus(context.operationStatus || context.status || "UNKNOWN");
    return {
      schemaVersion: RELIABILITY_VERSION,
      event: safeEvent,
      status: normalizeStatus(report.status),
      severity: reliabilitySeverity(safeEvent, { ...context, attempt, retryCount, oldestQueuedAgeMs }),
      issueCodes: unique((report.issueCodes || []).map(normalizeStatus)).slice(0, 12),
      repairActions: unique((report.repairActions || []).map(normalizeStatus)).slice(0, 8),
      pendingWrites: boundedCount(context.pendingWrites, 1000),
      conflictCount: boundedCount(context.conflictCount, 1000),
      retryCount,
      attempt,
      oldestQueuedAgeMs,
      operation: clean(context.operation).slice(0, 48),
      subsystem: clean(context.subsystem || context.type).slice(0, 48),
      operationStatus,
      revision: boundedCount(context.revision, Number.MAX_SAFE_INTEGER),
      accountConfirmed: context.accountConfirmed === true,
      online: context.online !== false,
      errorName: clean(context.errorName).slice(0, 48),
      errorCode: clean(context.errorCode || context.code).slice(0, 48),
      route: SAFE_ROUTES.has(requestedRoute) ? requestedRoute : "app",
      version: RELIABILITY_VERSION,
      fingerprint: clean(report.fingerprint).slice(0, 160)
    };
  }

  return { VERSION, RELIABILITY_VERSION, evaluate, reliabilitySeverity, telemetryPayload };
});
