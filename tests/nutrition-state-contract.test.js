"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const FuelState = require("../assets/js/nutrition-state-contract.js");

test("Fuel client state types match the database contract", () => {
  assert.equal(FuelState.VERSION, "030P.1");
  assert.deepEqual(FuelState.ALLOWED_STATE_TYPES, [
    "BASELINE_HISTORY", "ADAPTIVE_GOAL", "ADAPTIVE_APPROVAL", "MEAL_WINDOW", "REVIEW_HISTORY",
    "MANUAL_DAY", "FASTING_PROTOCOL", "FASTING_EXECUTION", "MEAL_EXECUTION", "FUEL_CLOSED_LOOP"
  ]);
  assert.equal(FuelState.normalizeStateType("fasting"), "FASTING_PROTOCOL");
  assert.equal(FuelState.normalizeStateType("meal-log"), "MEAL_EXECUTION");
  assert.equal(FuelState.normalizeStateType("unknown"), null);
});

test("legacy aliases merge into one newest canonical row", () => {
  const rows = FuelState.normalizeRows([
    { state_type: "FASTING", state_key: "current", payload: { hours: 14 }, updated_at: "2026-08-20T10:00:00Z" },
    { state_type: "FASTING_PROTOCOL", state_key: "current", payload: { hours: 16 }, updated_at: "2026-08-21T10:00:00Z" },
    { state_type: "MEAL_LOG", state_key: "2026-08-21", payload: { meals: 3 }, updated_at: "2026-08-21T23:00:00Z" }
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.find((row) => row.state_type === "FASTING_PROTOCOL").payload, { hours: 16 });
  assert.equal(rows.find((row) => row.state_type === "MEAL_EXECUTION").state_key, "2026-08-21");
});

test("Fuel retries deduplicate only identical confirmed or queued writes", () => {
  const payload = { revision: 4, calories: 2300, protein: 185 };
  const identity = FuelState.writeIdentity({ userId: "recruit-1", stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload });
  const queued = FuelState.shouldPersist({
    userId: "recruit-1", stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload,
    pending: [{ stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload }]
  });
  const confirmed = FuelState.shouldPersist({
    userId: "recruit-1", stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload,
    meta: { syncedAt: "2026-08-24T20:00:00Z", payloadHash: identity.payloadHash }
  });
  const changed = FuelState.shouldPersist({
    userId: "recruit-1", stateType: "MANUAL_DAY", stateKey: "2026-08-24", payload: { ...payload, calories: 2400 },
    meta: { syncedAt: "2026-08-24T20:00:00Z", payloadHash: identity.payloadHash }
  });
  assert.equal(queued.reason, "ALREADY_QUEUED");
  assert.equal(confirmed.reason, "ALREADY_CONFIRMED");
  assert.equal(changed.persist, true);
});

test("database failures are classified without exposing raw constraint text", () => {
  const failure = FuelState.classifyFailure({ code: "23514", message: "nutrition_state_state_type_check violated" });
  assert.equal(failure.category, "FUEL_SCHEMA_RETRY");
  assert.equal(failure.persistenceState, "TRANSIENT_FAILURE");
  assert.equal(failure.userMessage, "Fuel save needs retry");
  assert.doesNotMatch(failure.userMessage, /constraint|nutrition_state|23514/i);
});
