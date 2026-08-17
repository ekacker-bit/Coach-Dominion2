const { randomBytes } = require("node:crypto");

const ALLOWED_EVENTS = new Set([
  "trust_check", "repair_started", "repair_completed", "repair_failed", "runtime_error",
  "sync_started", "sync_completed", "conflict_detected", "save_queued", "queue_retry",
  "retry_succeeded", "retry_failed", "sync_failed", "startup_recovery"
]);
const ALLOWED_STATUSES = new Set(["CHECKING", "VERIFIED", "RECOVERED", "REPAIRING", "PROTECTED", "ACTION_REQUIRED"]);
const ALLOWED_ROUTES = new Set(["app", "today", "performance", "calendar", "nutrition", "program", "inspection", "contract", "connected", "more", "runtime", "promise"]);
const FAILURE_EVENTS = new Set(["runtime_error", "repair_failed", "sync_failed"]);

function clean(value, max = 80) {
  return String(value == null ? "" : value).replace(/[^a-z0-9_./|-]/gi, "").slice(0, max);
}

function cleanList(value, max = 12) {
  return Array.isArray(value) ? [...new Set(value.map((item) => clean(item, 60)).filter(Boolean))].slice(0, max) : [];
}

function bodyFromRequest(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); }
  catch (_) { return {}; }
}

function boundedNumber(value, max = 999999) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0;
}

function reliabilitySeverity(event, body = {}) {
  const attempt = Math.max(boundedNumber(body.attempt, 100), boundedNumber(body.retryCount, 100));
  const oldestQueuedAgeMs = boundedNumber(body.oldestQueuedAgeMs, 7 * 24 * 60 * 60 * 1000);
  if (FAILURE_EVENTS.has(event)) return "error";
  if (event === "retry_failed") return attempt >= 3 || oldestQueuedAgeMs >= 5 * 60 * 1000 ? "error" : "warning";
  if (event === "conflict_detected") return "warning";
  if (event === "save_queued" && (boundedNumber(body.pendingWrites, 1000) >= 3 || oldestQueuedAgeMs >= 2 * 60 * 1000)) return "warning";
  return "info";
}

function supportCode() {
  return `CD-${randomBytes(4).toString("hex").toUpperCase()}`;
}

module.exports = function handler(req, res) {
  const startedAt = Date.now();
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const length = Number(req.headers?.["content-length"] || 0);
  if (length > 8192) return res.status(413).json({ ok: false, error: "payload_too_large" });
  const body = bodyFromRequest(req);
  let serializedSize = 0;
  try { serializedSize = Buffer.byteLength(JSON.stringify(body)); }
  catch (_) { return res.status(400).json({ ok: false, error: "invalid_payload" }); }
  if (serializedSize > 8192) return res.status(413).json({ ok: false, error: "payload_too_large" });
  const event = ALLOWED_EVENTS.has(body.event) ? body.event : "trust_check";
  const status = ALLOWED_STATUSES.has(body.status) ? body.status : "CHECKING";
  const severity = reliabilitySeverity(event, body);
  const incidentCode = supportCode();
  const record = {
    type: "coach_dominion_trust",
    category: "production_reliability",
    schemaVersion: "029L.1",
    severity,
    supportCode: incidentCode,
    event,
    status,
    issueCodes: cleanList(body.issueCodes),
    repairActions: cleanList(body.repairActions, 8),
    pendingWrites: boundedNumber(body.pendingWrites, 1000),
    conflictCount: boundedNumber(body.conflictCount, 1000),
    retryCount: boundedNumber(body.retryCount, 100),
    attempt: boundedNumber(body.attempt, 100),
    oldestQueuedAgeMs: boundedNumber(body.oldestQueuedAgeMs, 7 * 24 * 60 * 60 * 1000),
    operation: clean(body.operation, 48),
    subsystem: clean(body.subsystem, 48),
    operationStatus: clean(body.operationStatus, 48),
    revision: boundedNumber(body.revision, Number.MAX_SAFE_INTEGER),
    accountConfirmed: body.accountConfirmed === true,
    online: body.online !== false,
    errorName: clean(body.errorName, 48),
    errorCode: clean(body.errorCode, 48),
    route: ALLOWED_ROUTES.has(body.route) ? body.route : "app",
    clientVersion: clean(body.version, 30),
    fingerprint: clean(body.fingerprint, 160),
    requestId: clean(req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"] || "", 100),
    receivedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt
  };
  const serialized = JSON.stringify(record);
  if (severity === "error") console.error(serialized);
  else if (severity === "warning") console.warn(serialized);
  else console.info(serialized);
  return res.status(202).json({ ok: true, supportCode: incidentCode, severity });
};
