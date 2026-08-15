const test = require("node:test");
const assert = require("node:assert/strict");
const Campaign = require("../assets/js/dominion-campaign.js");

const contract = {
  id: "contract-26",
  revision: 3,
  status: "APPROVED",
  effectiveDate: "2026-08-10",
  primaryGoal: "LOSE_FAT",
  target: "Reach a durable fighting weight",
  targetDate: "2026-12-01"
};

const receipt = {
  status: "ACTIVE",
  contractId: contract.id,
  contractRevision: contract.revision,
  weekStart: "2026-08-10",
  activatedAt: "2026-08-09T16:00:00.000Z"
};

function week(start, activitiesByDay = {}) {
  return {
    id: `week-${start}`,
    status: "ACTIVE",
    weekStart: start,
    weekEnd: Campaign.addDays(start, 6),
    days: Array.from({ length: 7 }, (_, index) => {
      const date = Campaign.addDays(start, index);
      return { date, activities: activitiesByDay[index] || [] };
    })
  };
}

function action(id, module, title) {
  return { id, module, title };
}

function proof(id, date, domain, status = "VERIFIED") {
  return { id, date, domain, status, occurredAt: `${date}T12:00:00.000Z` };
}

test("campaign waits for a signed Contract", () => {
  const result = Campaign.buildCampaign({ today: "2026-08-14" });
  assert.equal(result.status, "CONTRACT_REQUIRED");
  assert.equal(result.currentOrder.code, "CONTRACT");
});

test("campaign will not start from a program receipt for another Contract revision", () => {
  const result = Campaign.buildCampaign({
    today: "2026-08-14",
    contract,
    programReceipt: { ...receipt, contractRevision: 2 }
  });
  assert.equal(result.status, "PROGRAM_REQUIRED");
  assert.equal(result.currentOrder.code, "PROGRAM");
});

test("campaign anchors to the activated week and creates four three-week phases", () => {
  const result = Campaign.buildCampaign({ today: "2026-08-14", contract, programReceipt: receipt });
  assert.equal(result.startDate, "2026-08-10");
  assert.equal(result.endDate, "2026-11-01");
  assert.equal(result.totalWeeks, 12);
  assert.deepEqual(result.phases.map((phase) => phase.code), ["FOUNDATION", "BUILD", "PRESSURE", "PROVE"]);
  assert.equal(result.currentWeek, 1);
  assert.equal(result.phase.code, "FOUNDATION");
});

test("campaign counts two same-domain sessions on one day independently", () => {
  const firstWeek = week("2026-08-10", {
    0: [action("lower-am", "STRENGTH", "Lower A"), action("upper-pm", "STRENGTH", "Upper A")]
  });
  const oneProof = Campaign.buildCampaign({
    today: "2026-08-10",
    contract,
    programReceipt: receipt,
    weeks: [firstWeek],
    receipts: [proof("proof-lower", "2026-08-10", "strength")]
  });
  assert.equal(oneProof.execution.scheduled, 2);
  assert.equal(oneProof.execution.secured, 1);
  assert.equal(oneProof.execution.rate, 50);

  const twoProofs = Campaign.buildCampaign({
    today: "2026-08-10",
    contract,
    programReceipt: receipt,
    weeks: [firstWeek],
    receipts: [proof("proof-lower", "2026-08-10", "strength"), proof("proof-upper", "2026-08-10", "strength")]
  });
  assert.equal(twoProofs.execution.secured, 2);
  assert.equal(twoProofs.execution.rate, 100);
});

test("incomplete receipts do not satisfy a campaign action", () => {
  const firstWeek = week("2026-08-10", { 0: [action("run-1", "CARDIO", "Easy run")] });
  const result = Campaign.buildCampaign({
    today: "2026-08-10",
    contract,
    programReceipt: receipt,
    weeks: [firstWeek],
    receipts: [proof("run-open", "2026-08-10", "running", "INCOMPLETE")]
  });
  assert.equal(result.execution.secured, 0);
  assert.equal(result.currentOrder.code, "EXECUTE");
});

test("phase changes strictly with the campaign week", () => {
  const expectations = [
    ["2026-08-10", 1, "FOUNDATION"],
    ["2026-08-31", 4, "BUILD"],
    ["2026-09-21", 7, "PRESSURE"],
    ["2026-10-12", 10, "PROVE"]
  ];
  expectations.forEach(([today, currentWeek, phase]) => {
    const result = Campaign.buildCampaign({ today, contract, programReceipt: receipt });
    assert.equal(result.currentWeek, currentWeek);
    assert.equal(result.phase.code, phase);
  });
});

test("a ready weekly judgment becomes the current campaign order", () => {
  const result = Campaign.buildCampaign({
    today: "2026-08-16",
    contract,
    programReceipt: receipt,
    weeks: [week("2026-08-10")],
    currentInspection: { canFinalize: true }
  });
  assert.equal(result.currentOrder.code, "FINALIZE_WEEK");
  assert.equal(result.currentOrder.section, "inspection");
});

test("open standards block the final win condition", () => {
  const result = Campaign.buildCampaign({
    today: "2026-08-14",
    contract,
    programReceipt: receipt,
    standards: [{ id: "case-1", status: "ACTIVE" }]
  });
  const standard = result.conditions.find((condition) => condition.id === "STANDARDS");
  assert.equal(standard.passed, false);
  assert.equal(result.standards.open, 1);
});

test("a new Contract revision creates a new campaign identity", () => {
  const first = Campaign.buildCampaign({ today: "2026-08-14", contract, programReceipt: receipt });
  const amended = { ...contract, revision: 4 };
  const next = Campaign.buildCampaign({
    today: "2026-08-14",
    contract: amended,
    programReceipt: { ...receipt, contractRevision: 4 },
    previous: first
  });
  assert.notEqual(next.id, first.id);
  assert.equal(next.contractRevision, 4);
});

test("campaign history is idempotent for the same week, phase, and forecast", () => {
  const campaign = Campaign.buildCampaign({ today: "2026-08-14", contract, programReceipt: receipt });
  const once = Campaign.upsertHistory([], campaign);
  const twice = Campaign.upsertHistory(once, { ...campaign, updatedAt: "2026-08-14T20:00:00.000Z" });
  assert.equal(once.length, 1);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].id, once[0].id);
});
