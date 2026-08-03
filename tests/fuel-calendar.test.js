const test = require("node:test");
const assert = require("node:assert/strict");
const { VERSION, buildFuelCalendarContext } = require("../assets/js/fuel-calendar.js");

const activity = (overrides = {}) => ({
  id: "lift",
  module: "STRENGTH",
  title: "Upper strength",
  type: "STRENGTH",
  estimatedMinutes: 70,
  sessionOrder: 1,
  sessionWindow: "AM",
  trainingWindowId: "window-1",
  ...overrides
});

test("023B exposes a deterministic calendar context engine", () => {
  assert.equal(VERSION, "023B.1");
});

test("a committed recovery day overrides recorded training history", () => {
  const result = buildFuelCalendarContext({
    date: "2026-08-03",
    committedDay: { date: "2026-08-03", activities: [] },
    importedTrainingDay: true
  });
  assert.equal(result.source, "COMMITTED CALENDAR");
  assert.equal(result.trainingDay, false);
  assert.equal(result.recoveryDay, true);
  assert.equal(result.targetPolicy, "APPROVED RECOVERY TARGETS");
});

test("paired Core stays inside one fueling window", () => {
  const result = buildFuelCalendarContext({
    committedDay: {
      activities: [
        activity(),
        activity({ id: "core", module: "CORE", title: "Core", estimatedMinutes: 20, tertiary: true })
      ],
      sessionCount: 1,
      corePaired: true,
      estimatedMinutes: 90
    }
  });
  assert.equal(result.sessionCount, 1);
  assert.equal(result.corePaired, true);
  assert.equal(result.splitDay, false);
  assert.match(result.sessions[0].label, /Strength \+ Core/);
});

test("Two-a-Day calendar creates AM and PM fueling context", () => {
  const result = buildFuelCalendarContext({
    committedDay: {
      twoADay: true,
      estimatedMinutes: 150,
      betweenSessionFuelingRequired: true,
      activities: [
        activity(),
        activity({ id: "run", module: "RUNNING", title: "Tempo run", type: "TEMPO", estimatedMinutes: 80, sessionOrder: 2, sessionWindow: "PM", trainingWindowId: "window-2" })
      ]
    },
    splitCheckpoint: { refueled: true }
  });
  assert.equal(result.splitDay, true);
  assert.equal(result.mealWindow, "SPLIT_DAY");
  assert.equal(result.phase, "BETWEEN_SESSIONS");
  assert.deepEqual(result.sessions.map((session) => session.window), ["AM", "PM"]);
});

test("long runs keep an open duration and use the long-run meal map", () => {
  const result = buildFuelCalendarContext({
    committedDay: {
      longRunUncapped: true,
      estimatedMinutes: 240,
      activities: [activity({ id: "long", module: "RUNNING", title: "Long run", type: "LONG", estimatedMinutes: 240 })]
    }
  });
  assert.equal(result.longRunUncapped, true);
  assert.equal(result.mealWindow, "LONG_RUN");
  assert.match(result.headline, /duration open/i);
});

test("recorded training is a visible fallback when the calendar is missing", () => {
  const result = buildFuelCalendarContext({ importedTrainingDay: true });
  assert.equal(result.source, "RECORDED TRAINING");
  assert.equal(result.trainingDay, true);
  assert.equal(result.blocker, true);
  assert.match(result.detail, /Commit the week/);
});

