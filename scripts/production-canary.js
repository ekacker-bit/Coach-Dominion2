"use strict";

const DEFAULT_BASE_URL = "https://coach-dominion2.vercel.app";
const DEFAULT_EXPECTED_RELEASE = "029M.1";

function parseArgs(argv = []) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    values[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return {
    baseUrl: values["base-url"] || process.env.COACH_DOMINION_CANARY_URL || DEFAULT_BASE_URL,
    expectedRelease: values["expected-release"] || process.env.COACH_DOMINION_EXPECTED_RELEASE || DEFAULT_EXPECTED_RELEASE,
    expectedCommit: values["expected-commit"] || process.env.GITHUB_SHA || "",
    attempts: Math.max(1, Math.min(60, Number(values.attempts || 30))),
    intervalMs: Math.max(0, Math.min(30000, Number(values["interval-ms"] || 10000))),
    requestTimeoutMs: Math.max(1000, Math.min(30000, Number(values["request-timeout-ms"] || 10000)))
  };
}

function normalizedBaseUrl(value) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("Canary base URL must use HTTPS.");
  return url.origin;
}

function requireValue(condition, message, code) {
  if (condition) return;
  const error = new Error(message);
  error.code = code;
  throw error;
}

async function request(fetchImpl, url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function responseJson(response, label) {
  try { return await response.json(); }
  catch (_) {
    const error = new Error(`${label} did not return JSON.`);
    error.code = "INVALID_JSON";
    throw error;
  }
}

async function probe(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  requireValue(typeof fetchImpl === "function", "Fetch is unavailable.", "FETCH_UNAVAILABLE");
  const baseUrl = normalizedBaseUrl(options.baseUrl || DEFAULT_BASE_URL);
  const expectedRelease = String(options.expectedRelease || DEFAULT_EXPECTED_RELEASE);
  const expectedCommit = String(options.expectedCommit || "").toLowerCase();
  const timeoutMs = Number(options.requestTimeoutMs || 10000);
  const startedAt = Date.now();

  const healthResponse = await request(fetchImpl, `${baseUrl}/api/health?canary=${encodeURIComponent(expectedRelease)}`, {
    headers: { accept: "application/json", "cache-control": "no-cache" }
  }, timeoutMs);
  requireValue(healthResponse.ok, `Health returned ${healthResponse.status}.`, "HEALTH_HTTP");
  const health = await responseJson(healthResponse, "Health");
  requireValue(health.ok === true && health.service === "coach-dominion" && health.status === "ready", "Health contract is not ready.", "HEALTH_CONTRACT");
  requireValue(health.release === expectedRelease, `Production is serving ${health.release || "an unversioned release"}; expected ${expectedRelease}.`, "STALE_RELEASE");
  if (expectedCommit) {
    requireValue(/^[a-f0-9]{40}$/.test(expectedCommit), "Expected commit must be a full Git SHA.", "INVALID_COMMIT");
    requireValue(String(health.commit || "").toLowerCase() === expectedCommit, `Production commit is ${health.commit || "unavailable"}; expected ${expectedCommit}.`, "STALE_COMMIT");
  }
  requireValue(health.checks?.reliabilitySignals === "structured" && health.checks?.productionCanary === "available", "Reliability checks are incomplete.", "HEALTH_CHECKS");
  requireValue(String(healthResponse.headers?.get?.("cache-control") || "").includes("no-store"), "Health response is cacheable.", "HEALTH_CACHE");

  const appResponse = await request(fetchImpl, `${baseUrl}/app?canary=${encodeURIComponent(expectedRelease)}`, {
    headers: { accept: "text/html", "cache-control": "no-cache" }
  }, timeoutMs);
  requireValue(appResponse.ok, `Application shell returned ${appResponse.status}.`, "APP_HTTP");
  const html = await appResponse.text();
  requireValue(html.includes(`<meta name="coach-dominion-release" content="${expectedRelease}">`), "Application shell release marker is stale.", "APP_RELEASE");
  requireValue(html.includes('id="account-truth-health"'), "Application shell contract is incomplete.", "APP_CONTRACT");

  const telemetryBody = {
    event: "trust_check",
    status: "VERIFIED",
    route: "app",
    version: expectedRelease,
    operation: "production_canary",
    subsystem: "DEPLOYMENT",
    operationStatus: "VERIFIED",
    pendingWrites: 0,
    retryCount: 0,
    accountConfirmed: false,
    online: true
  };
  const telemetryResponse = await request(fetchImpl, `${baseUrl}/api/trust-events`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(telemetryBody)
  }, timeoutMs);
  requireValue(telemetryResponse.status === 202, `Telemetry returned ${telemetryResponse.status}.`, "TELEMETRY_HTTP");
  const telemetry = await responseJson(telemetryResponse, "Telemetry");
  requireValue(telemetry.ok === true && telemetry.severity === "info" && /^CD-[A-F0-9]{8}$/.test(telemetry.supportCode || ""), "Telemetry receipt is invalid.", "TELEMETRY_CONTRACT");

  return {
    type: "coach_dominion_canary",
    ok: true,
    baseUrl,
    release: expectedRelease,
    commit: health.commit || null,
    health: "ready",
    app: "ready",
    telemetry: "ready",
    supportCode: telemetry.supportCode,
    durationMs: Date.now() - startedAt
  };
}

async function runCanary(options = {}) {
  const attempts = Math.max(1, Number(options.attempts || 30));
  const intervalMs = Math.max(0, Number(options.intervalMs ?? 10000));
  const sleep = options.sleep || ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await probe(options);
      return { ...result, attempt };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(intervalMs);
    }
  }
  const failure = new Error(`Production canary failed after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${lastError?.message || "Unknown failure"}`);
  failure.code = lastError?.code || "CANARY_FAILED";
  throw failure;
}

if (require.main === module) {
  runCanary(parseArgs(process.argv.slice(2)))
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(JSON.stringify({ type: "coach_dominion_canary", ok: false, code: error.code || "CANARY_FAILED", message: error.message }));
      process.exitCode = 1;
    });
}

module.exports = { DEFAULT_BASE_URL, DEFAULT_EXPECTED_RELEASE, parseArgs, normalizedBaseUrl, probe, runCanary };
