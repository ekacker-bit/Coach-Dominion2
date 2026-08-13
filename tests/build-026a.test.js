const assert = require("assert");
const fs = require("fs");

const read = (path) => fs.readFileSync(path, "utf8");
const html = read("app.html");
const app = read("assets/js/app.js");
const css = read("assets/styles.css");
const worker = read("sw.js");

assert.match(html, /id="today-flow-map"/);
assert.match(html, /data-today-flow-stage="CLEAR"/);
assert.match(html, /data-today-flow-stage="EXECUTE"/);
assert.match(html, /data-today-flow-stage="CLOSE"/);
assert.match(html, /id="today-more-context"/);
assert.match(app, /function todayFlowStage/);
assert.match(app, /function renderTodayFlow/);
assert.match(app, /today\.dataset\.todayFlowStep = stage/);
assert.match(app, /currentId === "record"/);
assert.match(app, /context\.open = true/);
assert.match(css, /data-today-flow-step="CLEAR"/);
assert.match(css, /data-today-flow-step="EXECUTE"/);
assert.match(css, /data-today-flow-step="CLOSE"/);
assert.match(css, /data-checkpoint-state="DUE"/);
assert.match(css, /\.today-more-context/);
assert.match(worker, /025x-025y-025z-026a/);

const moreContextStart = html.indexOf('id="today-more-context"');
const mobileCommand = html.indexOf('id="mobile-command"');
const workoutDetail = html.indexOf('today-workout-detail', moreContextStart);
const contextEnd = html.indexOf('<section id="record"', moreContextStart);
assert.ok(moreContextStart > 0 && mobileCommand > moreContextStart, "Mobile shortcuts belong under More context");
assert.ok(workoutDetail > mobileCommand && workoutDetail < contextEnd, "Workout detail remains available under More context");

console.log("Build 026A Today flow integration tests passed.");
