(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionAccountEntry = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "ACCOUNT_ENTRY_V1";
  const ACCESS_STATES = Object.freeze(["CLOSED_ALPHA", "TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "BLOCKED"]);

  function cleanEmail(value = "") {
    return String(value || "").trim().toLowerCase();
  }

  function validateSignup(input = {}) {
    const email = cleanEmail(input.email);
    const password = String(input.password || "");
    const confirmation = String(input.confirmation || "");
    const errors = [];
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: "email", message: "Enter a valid email address." });
    if (password.length < 8) errors.push({ field: "password", message: "Use at least 8 characters." });
    if (password !== confirmation) errors.push({ field: "confirmation", message: "Passwords do not match." });
    return { valid: errors.length === 0, email, password, errors };
  }

  function signupOptions(origin = "") {
    const base = String(origin || "").replace(/\/$/, "");
    return {
      emailRedirectTo: `${base}/app#contract`,
      data: {
        signup_source: "self_service",
        onboarding_version: VERSION
      }
    };
  }

  function signupOutcome(data = {}) {
    return data?.session
      ? { state: "SESSION_ACTIVE", destination: "/app#contract" }
      : { state: "CONFIRMATION_REQUIRED", destination: null };
  }

  function accountAccess(user = {}) {
    const appMetadata = user?.app_metadata && typeof user.app_metadata === "object" ? user.app_metadata : {};
    const requested = String(appMetadata.account_access || appMetadata.subscription_status || "CLOSED_ALPHA").toUpperCase();
    const status = ACCESS_STATES.includes(requested) ? requested : "CLOSED_ALPHA";
    return {
      status,
      entitled: ["CLOSED_ALPHA", "TRIAL", "ACTIVE"].includes(status),
      billingManaged: status !== "CLOSED_ALPHA",
      source: "APP_METADATA"
    };
  }

  return Object.freeze({ VERSION, ACCESS_STATES: [...ACCESS_STATES], cleanEmail, validateSignup, signupOptions, signupOutcome, accountAccess });
});
