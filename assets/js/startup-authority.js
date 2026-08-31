(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStartupAuthority = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "031A.1";
  const PHASES = Object.freeze({
    AUTHENTICATING: "AUTHENTICATING",
    ACCOUNT_LOADING: "ACCOUNT_LOADING",
    DEVICE_LOADING: "DEVICE_LOADING",
    RECONCILING: "RECONCILING",
    VALIDATING: "VALIDATING",
    READY: "READY",
    DEGRADED: "DEGRADED",
    BLOCKED: "BLOCKED"
  });
  const ACTIONABLE = new Set([PHASES.READY, PHASES.DEGRADED]);

  function text(value = "") {
    return String(value ?? "").trim();
  }

  function initial(options = {}) {
    return {
      version: VERSION,
      phase: PHASES.AUTHENTICATING,
      actionable: false,
      readOnly: true,
      accountAvailable: null,
      deviceVerified: false,
      reconciled: false,
      validated: false,
      hydrationComplete: false,
      backgroundHydration: false,
      mode: "PROTECTED_LOADING",
      message: options.message || "Restoring your protected program…",
      errorCode: null
    };
  }

  function transition(current = initial(), phase = PHASES.AUTHENTICATING, options = {}) {
    const nextPhase = PHASES[phase] || phase;
    const actionable = ACTIONABLE.has(nextPhase) && options.validated !== false;
    const hydrationComplete = options.hydrationComplete ?? current.hydrationComplete ?? false;
    return {
      ...current,
      ...options,
      phase: nextPhase,
      actionable,
      hydrationComplete,
      backgroundHydration: actionable && !hydrationComplete,
      readOnly: !actionable || !hydrationComplete || options.readOnly === true,
      mode: nextPhase === PHASES.DEGRADED ? "OFFLINE_VERIFIED_DEVICE"
        : nextPhase === PHASES.BLOCKED ? "RESTORE_BLOCKED"
          : actionable && !hydrationComplete ? "AUTHORITATIVE_READ_ONLY"
            : actionable ? "AUTHORITATIVE" : "PROTECTED_LOADING",
      message: text(options.message) || (nextPhase === PHASES.DEGRADED
        ? "Cloud verification is unavailable. Your last verified device copy is active."
        : nextPhase === PHASES.BLOCKED
          ? "Your protected program could not be restored yet."
          : actionable ? "Your protected program is ready." : "Restoring your protected program…")
    };
  }

  function reconcile(input = {}) {
    const accountAvailable = input.accountAvailable === true;
    const hydrationComplete = input.hydrationComplete !== false;
    const accountSnapshot = input.accountSnapshot || null;
    const deviceSnapshot = input.deviceSnapshot || null;
    const deviceVerified = Boolean(deviceSnapshot?.fingerprint && input.deviceVerified !== false);
    if (!accountAvailable) {
      if (deviceVerified) return transition(initial(), PHASES.DEGRADED, {
        accountAvailable: false,
        deviceVerified: true,
        reconciled: true,
        validated: true,
        hydrationComplete: false,
        readOnly: true,
        errorCode: input.errorCode || "ACCOUNT_UNAVAILABLE"
      });
      return transition(initial(), PHASES.BLOCKED, {
        accountAvailable: false,
        deviceVerified: false,
        reconciled: false,
        validated: false,
        errorCode: input.errorCode || "NO_VERIFIED_SNAPSHOT"
      });
    }
    const snapshot = input.reconciledSnapshot || accountSnapshot || deviceSnapshot;
    const validated = Boolean(snapshot?.fingerprint && input.validation?.valid !== false);
    return transition(initial(), validated ? PHASES.READY : PHASES.BLOCKED, {
      accountAvailable: true,
      deviceVerified,
      reconciled: Boolean(snapshot),
      validated,
      hydrationComplete,
      readOnly: !hydrationComplete,
      errorCode: validated ? null : input.validation?.code || "RECONCILIATION_INVALID"
    });
  }

  function completeHydration(state = initial()) {
    if (!permitsAction(state)) return state;
    return transition(state, state.phase, {
      hydrationComplete: state.phase === PHASES.READY,
      readOnly: state.phase === PHASES.DEGRADED,
      message: state.phase === PHASES.DEGRADED
        ? "Cloud verification is unavailable. Your last verified device copy is active."
        : "Your protected program is ready."
    });
  }

  function verifiedDevicePreview(current = initial(), input = {}) {
    if (!input.deviceSnapshot?.fingerprint || input.deviceVerified === false) return current;
    return transition(current, PHASES.READY, {
      accountAvailable: null,
      deviceVerified: true,
      reconciled: true,
      validated: true,
      hydrationComplete: false,
      readOnly: true,
      errorCode: null,
      message: "Your verified program is available while account confirmation finishes."
    });
  }

  function timeout(state = initial(), input = {}) {
    if (permitsAction(state)) return state;
    if (input.verifiedSnapshot === true) {
      return transition(state, PHASES.DEGRADED, {
        validated: true,
        reconciled: true,
        deviceVerified: true,
        hydrationComplete: false,
        readOnly: true,
        errorCode: "RESTORE_TIMEOUT",
        message: "Account verification is still running. Your last verified program is available read-only."
      });
    }
    return transition(state, PHASES.BLOCKED, {
      validated: false,
      hydrationComplete: false,
      readOnly: true,
      errorCode: "RESTORE_TIMEOUT",
      message: "Restore took too long. Nothing changed. Retry when ready."
    });
  }

  function timing(startedAt, marks = {}, completedAt = null) {
    const start = Number(startedAt);
    const end = completedAt === null ? null : Number(completedAt);
    const normalized = Object.fromEntries(Object.entries(marks || {}).map(([key, value]) => [key, Math.max(0, Math.round(Number(value) - start))]));
    return Object.freeze({
      usableMs: normalized.usable ?? null,
      hydrationMs: end === null ? null : Math.max(0, Math.round(end - start)),
      phases: Object.freeze(normalized)
    });
  }

  function permitsAction(state = {}) {
    return ACTIONABLE.has(state.phase) && state.validated === true;
  }

  function permitsAccountWrite(state = {}, reason = "") {
    if (!permitsAction(state) || state.phase === PHASES.DEGRADED || state.hydrationComplete !== true || state.readOnly === true) return false;
    return !["startup", "hydration", "navigation", "route", "render"].includes(text(reason).toLowerCase());
  }

  return Object.freeze({ VERSION, PHASES: { ...PHASES }, initial, transition, reconcile, completeHydration, verifiedDevicePreview, timeout, timing, permitsAction, permitsAccountWrite });
});
