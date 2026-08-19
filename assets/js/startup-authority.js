(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionStartupAuthority = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "030E.1";
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
      mode: "PROTECTED_LOADING",
      message: options.message || "Restoring your protected program…",
      errorCode: null
    };
  }

  function transition(current = initial(), phase = PHASES.AUTHENTICATING, options = {}) {
    const nextPhase = PHASES[phase] || phase;
    const actionable = ACTIONABLE.has(nextPhase) && options.validated !== false;
    return {
      ...current,
      ...options,
      phase: nextPhase,
      actionable,
      readOnly: !actionable || options.readOnly === true,
      mode: nextPhase === PHASES.DEGRADED ? "OFFLINE_VERIFIED_DEVICE"
        : nextPhase === PHASES.BLOCKED ? "RESTORE_BLOCKED"
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
    const accountSnapshot = input.accountSnapshot || null;
    const deviceSnapshot = input.deviceSnapshot || null;
    const deviceVerified = Boolean(deviceSnapshot?.fingerprint && input.deviceVerified !== false);
    if (!accountAvailable) {
      if (deviceVerified) return transition(initial(), PHASES.DEGRADED, {
        accountAvailable: false,
        deviceVerified: true,
        reconciled: true,
        validated: true,
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
      readOnly: false,
      errorCode: validated ? null : input.validation?.code || "RECONCILIATION_INVALID"
    });
  }

  function permitsAction(state = {}) {
    return ACTIONABLE.has(state.phase) && state.validated === true;
  }

  function permitsAccountWrite(state = {}, reason = "") {
    if (!permitsAction(state) || state.phase === PHASES.DEGRADED) return false;
    return !["startup", "hydration", "navigation", "route", "render"].includes(text(reason).toLowerCase());
  }

  return Object.freeze({ VERSION, PHASES: { ...PHASES }, initial, transition, reconcile, permitsAction, permitsAccountWrite });
});
