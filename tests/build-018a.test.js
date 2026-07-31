const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const app = require("../assets/js/app.js");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase", "migrations", "021_morning_biometrics.sql"), "utf8");

for (const name of ["weight", "resting_heart_rate", "heart_rate_variability"]) {
  assert.match(html, new RegExp(`name="${name}"`), `missing ${name} Morning Roll Call input`);
}
for (const id of ["status-hrv", "summary-weight", "summary-rhr", "summary-hrv", "edit-roll-call"]) {
  assert.match(html, new RegExp(`id="${id}"`), `missing ${id}`);
}

assert.match(css, /\[hidden\]\{display:none!important\}/, "native hidden behavior must win over component display rules");
assert.match(css, /\.status-bar\{display:flex;gap:1px;overflow-x:auto/, "mobile status bar must remain one compact row");
assert.match(css, /\.command-header \.header-actions\{display:none\}/, "mobile account actions should move out of the command header");
assert.match(html, /class="connected-mobile-account-actions"/);
assert.match(js, /objective_metric_sources/);
assert.match(js, /heart_rate_variability/);
assert.match(migration, /add column if not exists heart_rate_variability/);

assert.equal(app.parseOptionalMetric("", app.OBJECTIVE_METRIC_CONFIG.weight), null);
assert.equal(app.parseOptionalMetric("181.4", app.OBJECTIVE_METRIC_CONFIG.weight), 181.4);
assert.equal(app.parseOptionalMetric("52", app.OBJECTIVE_METRIC_CONFIG.resting_heart_rate), 52);
assert.equal(app.parseOptionalMetric("47.5", app.OBJECTIVE_METRIC_CONFIG.heart_rate_variability), 47.5);
assert.throws(
  () => app.parseOptionalMetric("0", app.OBJECTIVE_METRIC_CONFIG.heart_rate_variability),
  /HRV must be between 1 and 500 ms/
);
assert.equal(app.objectiveSourceLabel("APPLE_HEALTH"), "Apple Health");
assert.equal(app.objectiveSourceLabel("MANUAL"), "Manual");

console.log("Build 018A tests passed.");
