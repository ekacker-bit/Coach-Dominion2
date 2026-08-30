"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Review Yesterday carries one explicit date through open, render, validation, and save", () => {
  const app = read("assets/js/app.js");
  const html = read("app.html");

  assert.match(app, /return openDailyCloseoutForDate\(order\.operatingDate/);
  assert.match(app, /function dailyCloseoutDate\(/);
  assert.match(app, /function openDailyCloseoutForDate\(/);
  assert.match(app, /readDailyCloseout\(operatingDate\)/);
  assert.match(app, /fieldCommandDayTerminal\(operatingDate\)/);
  assert.match(app, /closeoutFormInput\(operatingDate\)/);
  assert.match(app, /appleHealthReadinessForDate\(operatingDate\)/);
  assert.match(app, /sourceState = dailyState\?\.date === record\.date/);
  assert.match(app, /if \(data\.date === todayISODate\(\)\)/);
  assert.match(app, /if \(isToday\) await clearFrictionlessDraft\("closeout"\)/);
  assert.match(html, /id="daily-closeout-date"/);
  assert.match(html, /id="daily-closeout-intro-copy"/);
});

test("generic closeout actions explicitly restore today's operating date", () => {
  const app = read("assets/js/app.js");
  assert.ok((app.match(/openDailyCloseoutForDate\(todayISODate\(\)\)/g) || []).length >= 3);
});
