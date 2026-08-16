const ALLOWED_EVENTS = new Set(["trust_check", "repair_started", "repair_completed", "repair_failed", "runtime_error"]);
const ALLOWED_STATUSES = new Set(["CHECKING", "VERIFIED", "RECOVERED", "REPAIRING", "PROTECTED", "ACTION_REQUIRED"]);
const ALLOWED_ROUTES = new Set(["app", "today", "performance", "calendar", "nutrition", "program", "inspection", "contract", "connected", "more", "runtime", "promise"]);

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
  const event = ALLOWED_EVENTS.has(body.event) ? body.event : "trust_check";
  const status = ALLOWED_STATUSES.has(body.status) ? body.status : "CHECKING";
  const record = {
    type: "coach_dominion_trust",
    event,
    status,
    issueCodes: cleanList(body.issueCodes),
    repairActions: cleanList(body.repairActions, 8),
    pendingWrites: Math.max(0, Number(body.pendingWrites || 0)),
    conflictCount: Math.max(0, Number(body.conflictCount || 0)),
    route: ALLOWED_ROUTES.has(body.route) ? body.route : "app",
    clientVersion: clean(body.version, 30),
    fingerprint: clean(body.fingerprint, 160),
    requestId: clean(req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"] || "", 100),
    durationMs: Date.now() - startedAt
  };
  console.info(JSON.stringify(record));
  return res.status(202).json({ ok: true });
};
