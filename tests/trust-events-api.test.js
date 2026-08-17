const test = require("node:test");
const assert = require("node:assert/strict");
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

test("accepts a small allowlisted event and logs no supplied personal data", () => {
  const res = response();
  const logs = [];
  const original = console.info;
  console.info = (value) => logs.push(value);
  try {
    handler({
      method: "POST",
      headers: { "content-length": "240", "x-vercel-id": "cle1::abc" },
      body: {
        event: "repair_completed",
        status: "RECOVERED",
        issueCodes: ["TODAY_DECISION_MISSING"],
        repairActions: ["REBUILD_TODAY"],
        route: "today",
        email: "recruit@example.com",
        notes: "private readiness notes"
      }
    }, res);
  } finally {
    console.info = original;
  }
  assert.equal(res.statusCode, 202);
  assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(res.payload.ok, true);
  assert.equal(logs.length, 1);
  assert.doesNotMatch(logs[0], /recruit@example\.com|private readiness notes/);
  assert.match(logs[0], /"event":"repair_completed"/);
});

test("rejects unsupported methods and oversized payloads", () => {
  const getRes = response();
  handler({ method: "GET", headers: {} }, getRes);
  assert.equal(getRes.statusCode, 405);
  assert.equal(getRes.headers.allow, "POST");

  const largeRes = response();
  handler({ method: "POST", headers: { "content-length": "9000" }, body: {} }, largeRes);
  assert.equal(largeRes.statusCode, 413);
});

test("preserves allowlisted account-sync lifecycle events", () => {
  const res = response();
  const logs = [];
  const original = console.info;
  console.info = (value) => logs.push(value);
  try {
    handler({ method: "POST", headers: {}, body: { event: "retry_succeeded", status: "VERIFIED", route: "app" } }, res);
  } finally {
    console.info = original;
  }
  assert.equal(res.statusCode, 202);
  assert.match(logs[0], /"event":"retry_succeeded"/);
});
