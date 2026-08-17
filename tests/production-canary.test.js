"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizedBaseUrl,
  parseArgs,
  probe,
  runCanary
} = require("../scripts/production-canary.js");

function response(status, payload, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return headers[String(name).toLowerCase()] || null;
      }
    },
    async json() {
      if (typeof payload === "string") throw new Error("not json");
      return payload;
    },
    async text() {
      return typeof payload === "string" ? payload : JSON.stringify(payload);
    }
  };
}

const EXPECTED_COMMIT = "0123456789abcdef0123456789abcdef01234567";

function readyHealth(release = "029M.1", commit = EXPECTED_COMMIT) {
  return response(200, {
    ok: true,
    service: "coach-dominion",
    status: "ready",
    release,
    commit,
    checks: {
      reliabilitySignals: "structured",
      productionCanary: "available"
    }
  }, { "cache-control": "no-store" });
}

test("canary arguments are bounded to the named production contract", () => {
  const options = parseArgs([
    "--base-url", "https://example.com/ignored-path",
    "--expected-release", "029M.1",
    "--expected-commit", EXPECTED_COMMIT,
    "--attempts", "4",
    "--interval-ms", "250"
  ]);
  assert.equal(normalizedBaseUrl(options.baseUrl), "https://example.com");
  assert.equal(options.expectedRelease, "029M.1");
  assert.equal(options.expectedCommit, EXPECTED_COMMIT);
  assert.equal(options.attempts, 4);
  assert.equal(options.intervalMs, 250);
  assert.throws(() => normalizedBaseUrl("http://example.com"), /HTTPS/);
  assert.equal(normalizedBaseUrl("http://localhost:3000"), "http://localhost:3000");
});

test("canary waits for the expected release then verifies health, app, and telemetry", async () => {
  const requests = [];
  const queue = [
    readyHealth("029L.1"),
    readyHealth(),
    response(200, '<!doctype html><meta name="coach-dominion-release" content="029M.1"><section id="account-truth-health"></section>'),
    response(202, { ok: true, severity: "info", supportCode: "CD-A1B2C3D4" })
  ];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return queue.shift();
  };

  const result = await runCanary({
    baseUrl: "https://coach-dominion2.vercel.app",
    expectedRelease: "029M.1",
    expectedCommit: EXPECTED_COMMIT,
    attempts: 2,
    intervalMs: 0,
    requestTimeoutMs: 1000,
    fetchImpl,
    sleep: async () => {}
  });

  assert.equal(result.ok, true);
  assert.equal(result.attempt, 2);
  assert.equal(result.commit, EXPECTED_COMMIT);
  assert.equal(result.health, "ready");
  assert.equal(result.app, "ready");
  assert.equal(result.telemetry, "ready");
  assert.equal(result.supportCode, "CD-A1B2C3D4");
  const telemetryRequest = requests.find((item) => item.url.endsWith("/api/trust-events"));
  assert.ok(telemetryRequest);
  const telemetryBody = JSON.parse(telemetryRequest.options.body);
  assert.deepEqual(Object.keys(telemetryBody).sort(), [
    "accountConfirmed", "event", "online", "operation", "operationStatus",
    "pendingWrites", "retryCount", "route", "status", "subsystem", "version"
  ].sort());
  assert.equal(JSON.stringify(telemetryBody).includes("@"), false);
});

test("probe rejects cacheable health and invalid telemetry receipts", async () => {
  const cacheableFetch = async () => response(200, {
    ok: true,
    service: "coach-dominion",
    status: "ready",
    release: "029M.1",
    commit: EXPECTED_COMMIT,
    checks: { reliabilitySignals: "structured", productionCanary: "available" }
  }, { "cache-control": "public, max-age=60" });
  await assert.rejects(() => probe({
    baseUrl: "https://example.com",
    expectedRelease: "029M.1",
    expectedCommit: EXPECTED_COMMIT,
    requestTimeoutMs: 1000,
    fetchImpl: cacheableFetch
  }), (error) => error.code === "HEALTH_CACHE");

  const queue = [
    readyHealth(),
    response(200, '<meta name="coach-dominion-release" content="029M.1"><div id="account-truth-health"></div>'),
    response(202, { ok: true, severity: "warning", supportCode: "bad" })
  ];
  await assert.rejects(() => probe({
    baseUrl: "https://example.com",
    expectedRelease: "029M.1",
    expectedCommit: EXPECTED_COMMIT,
    requestTimeoutMs: 1000,
    fetchImpl: async () => queue.shift()
  }), (error) => error.code === "TELEMETRY_CONTRACT");
});

test("canary fails visibly when production never serves the expected commit", async () => {
  let calls = 0;
  await assert.rejects(() => runCanary({
    baseUrl: "https://example.com",
    expectedRelease: "029M.1",
    expectedCommit: EXPECTED_COMMIT,
    attempts: 2,
    intervalMs: 0,
    requestTimeoutMs: 1000,
    fetchImpl: async () => {
      calls += 1;
      return readyHealth("029M.1", "fedcba9876543210fedcba9876543210fedcba98");
    },
    sleep: async () => {}
  }), (error) => error.code === "STALE_COMMIT" && /after 2 attempts/.test(error.message));
  assert.equal(calls, 2);
});
