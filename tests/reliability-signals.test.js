const test = require("node:test");
const assert = require("node:assert/strict");
const Trust = require("../assets/js/trust-layer.js");
const handler = require("../api/trust-events.js");

function response() {
  return {
    statusCode: 0,
    headers: {},
    payload: null,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

function report(status = "PROTECTED") {
  return {
    status,
    issueCodes: ["ACCOUNT_SAVE_QUEUED"],
    repairActions: ["RETRY_SAVED_WORK"],
    fingerprint: "PROTECTED|ACCOUNT_SAVE_QUEUED|program-1"
  };
}

test("keeps the operational fields that make a queued save diagnosable", () => {
  const payload = Trust.telemetryPayload("retry_failed", report(), {
    route: "today",
    pendingWrites: 3,
    retryCount: 4,
    oldestQueuedAgeMs: 420000,
    operation: "retry_failed",
    type: "ACCOUNT_TRUTH",
    status: "SAVE_NOT_ACKNOWLEDGED",
    revision: 17,
    accountConfirmed: false,
    online: true,
    errorName: "PostgrestError",
    errorCode: "PGRST116",
    email: "recruit@example.com",
    message: "private health note"
  });
  assert.equal(payload.schemaVersion, "029L.1");
  assert.equal(payload.severity, "error");
  assert.equal(payload.pendingWrites, 3);
  assert.equal(payload.retryCount, 4);
  assert.equal(payload.oldestQueuedAgeMs, 420000);
  assert.equal(payload.operationStatus, "SAVE_NOT_ACKNOWLEDGED");
  assert.equal(payload.subsystem, "ACCOUNT_TRUTH");
  assert.equal(payload.revision, 17);
  assert.equal(payload.errorCode, "PGRST116");
  assert.equal(payload.email, undefined);
  assert.equal(payload.message, undefined);
  assert.doesNotMatch(JSON.stringify(payload), /recruit@example\.com|private health note/);
});

test("does not promote normal startup fallback or a first retry to error level", () => {
  assert.equal(Trust.reliabilitySeverity("startup_recovery", { retryCount: 0 }), "info");
  assert.equal(Trust.reliabilitySeverity("retry_failed", { retryCount: 1, oldestQueuedAgeMs: 1000 }), "warning");
  assert.equal(Trust.reliabilitySeverity("retry_failed", { retryCount: 3 }), "error");
  assert.equal(Trust.reliabilitySeverity("runtime_error"), "error");
});

test("returns a searchable support code and emits repeated retry failure as one structured error", () => {
  const res = response();
  const errors = [];
  const original = console.error;
  console.error = (value) => errors.push(value);
  try {
    handler({
      method: "POST",
      headers: { "x-vercel-id": "cle1::incident" },
      body: {
        event: "retry_failed",
        status: "PROTECTED",
        route: "today",
        pendingWrites: 3,
        retryCount: 4,
        oldestQueuedAgeMs: 420000,
        operation: "retry_failed",
        subsystem: "ACCOUNT_TRUTH",
        operationStatus: "SAVE_NOT_ACKNOWLEDGED",
        email: "recruit@example.com",
        message: "private health note"
      }
    }, res);
  } finally {
    console.error = original;
  }
  assert.equal(res.statusCode, 202);
  assert.equal(res.payload.severity, "error");
  assert.match(res.payload.supportCode, /^CD-[A-F0-9]{8}$/);
  assert.equal(errors.length, 1);
  const logged = JSON.parse(errors[0]);
  assert.equal(logged.category, "production_reliability");
  assert.equal(logged.supportCode, res.payload.supportCode);
  assert.equal(logged.retryCount, 4);
  assert.equal(logged.oldestQueuedAgeMs, 420000);
  assert.doesNotMatch(errors[0], /recruit@example\.com|private health note/);
});

test("logs successful recovery as information rather than a production error", () => {
  const res = response();
  const info = [];
  const errors = [];
  const originalInfo = console.info;
  const originalError = console.error;
  console.info = (value) => info.push(value);
  console.error = (value) => errors.push(value);
  try {
    handler({ method: "POST", headers: {}, body: { event: "startup_recovery", status: "RECOVERED", route: "app" } }, res);
  } finally {
    console.info = originalInfo;
    console.error = originalError;
  }
  assert.equal(res.payload.severity, "info");
  assert.equal(info.length, 1);
  assert.equal(errors.length, 0);
});
