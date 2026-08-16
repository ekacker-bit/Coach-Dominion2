const test = require("node:test");
const assert = require("node:assert/strict");
const ledger = require("../assets/js/transformation-ledger.js");

function trendModel(overrides = {}) {
  return {
    rangeLabel: "4 weeks",
    weight: { value: 178, observations: 4, changeLabel: "-4 lb trend in 28d", trendChange: -4, series: [{ date: "2026-07-20", value: 182 }, { date: "2026-08-16", value: 178 }] },
    bodyComposition: { measurements: { count: 2, summaries: { waist: { latest: 32, change: -1, observations: 2, series: [{ date: "2026-07-20", value: 33 }, { date: "2026-08-16", value: 32 }] } } }, decision: { tone: "positive", code: "CONTINUE" } },
    training: { strengthSessions: 4, runSessions: 3, runMiles: 12, runDelta: 20, strength: { workSets: 24, volumeDelta: 12, trajectory: "BUILDING" } },
    discipline: { value: 86, observations: 4, delta: 5, deltaLabel: "+5 pts vs prior week", tone: "positive" },
    nutrition: { value: 82, evidenceDays: 12, deltaLabel: "+8 pts vs prior window", state: "ON TARGET" },
    readiness: { value: 7, observations: 18, state: "READY", deltaLabel: "+1 vs prior 7d", tone: "positive" },
    ...overrides
  };
}

function campaign(overrides = {}) {
  return { id: "campaign:1", status: "ACTIVE", progress: 42, currentWeek: 6, totalWeeks: 12, phase: { label: "BUILD" }, forecast: { code: "ON_TRACK", label: "ON TRACK", tone: "green" }, evidence: { rate: 88 }, currentOrder: { label: "Hold the standard", detail: "Execute today's order.", section: "today" }, ...overrides };
}

test("ledger combines the complete transformation record without inventing extra destinations", () => {
  const model = ledger.buildLedger({
    trendModel: trendModel(),
    campaign: campaign(),
    standards: [],
    photos: [{ date: "2026-07-20" }, { date: "2026-08-16" }]
  });
  assert.equal(model.version, "028E.1");
  assert.deepEqual(model.signals.map((item) => item.id), ["weight", "measurements", "photos", "strength", "running", "adherence", "recovery", "standards", "campaign"]);
  assert.equal(model.confidence.score, 100);
  assert.equal(model.status.label, "ON TRACK");
  assert.equal(model.bookends.find((item) => item.id === "waist").change, "-1 in");
  assert.equal(model.changed.label, "Waist");
  assert.equal(model.next.section, "today");
});

test("thin evidence stays explicit and never becomes a progress claim", () => {
  const model = ledger.buildLedger({ trendModel: trendModel({
    weight: { value: 180, observations: 1, series: [{ date: "2026-08-16", value: 180 }] },
    bodyComposition: { measurements: { count: 0, summaries: { waist: { latest: null, change: null, observations: 0, series: [] } } }, decision: {} },
    training: { strengthSessions: 0, runSessions: 0, runMiles: 0, runDelta: null, strength: { workSets: 0, volumeDelta: null, trajectory: "LEARNING" } },
    discipline: { value: null, observations: 0, delta: null, tone: "neutral" },
    nutrition: { value: null, evidenceDays: 0, state: "LEARNING" },
    readiness: { value: null, observations: 0, state: "LEARNING", tone: "neutral" }
  }) });
  assert.equal(model.status.label, "BUILDING");
  assert.equal(model.changed.headline, "The baseline is still forming");
  assert.match(model.signals.find((item) => item.id === "photos").detail, /Second checkpoint/);
  assert.ok(model.confidence.score < 50);
});

test("recovery and confirmed standards outrank a positive campaign forecast", () => {
  const protectedModel = trendModel({ readiness: { value: 4, observations: 14, state: "PROTECT", tone: "negative", deltaLabel: "-2 vs prior 7d" } });
  const model = ledger.buildLedger({ trendModel: protectedModel, campaign: campaign(), standards: [{ status: "CONFIRMED" }] });
  assert.equal(model.status.label, "PROTECT");
  assert.equal(model.next.headline, "Protect the next exposure");
  assert.equal(model.next.section, "today");
});

test("confirmed standards create a bounded corrective next action", () => {
  const model = ledger.buildLedger({ trendModel: trendModel(), campaign: campaign(), standards: [{ status: "CONFIRMED" }, { status: "RESOLVED" }] });
  assert.equal(model.status.label, "CORRECT");
  assert.equal(model.next.headline, "Close the standards action");
  assert.equal(model.next.section, "standards");
  assert.equal(model.signals.find((item) => item.id === "standards").value, "1 open action");
});

test("campaign prerequisites remain the next order when commissioning is incomplete", () => {
  const model = ledger.buildLedger({ trendModel: trendModel(), campaign: campaign({ id: null, status: "PROGRAM_REQUIRED", progress: null, currentWeek: null, currentOrder: { label: "Commission the campaign", detail: "Activate the program.", section: "contract" } }) });
  assert.equal(model.next.headline, "Commission the campaign");
  assert.equal(model.next.section, "contract");
  assert.equal(model.signals.find((item) => item.id === "campaign").ready, false);
});
