const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const js = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");

for (const view of ["today", "plan", "review", "details"]) {
  assert(html.includes(`data-nutrition-view="${view}"`), `missing ${view} nutrition tab`);
  assert(html.includes(`data-nutrition-view-panel="${view}"`), `missing ${view} nutrition panel`);
}
for (const id of ["nutrition-command-output", "nutrition-baseline-form", "adaptive-fueling-output", "nutrition-intelligence-output", "nutrition-review-output", "meal-coaching-output", "nutrition-manual-form"]) {
  assert.strictEqual((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `${id} should be preserved exactly once`);
}
assert(html.includes("ATLAS // NEXT BEST ACTION"), "next best action card missing");
assert(js.includes("function setNutritionActiveView"), "nutrition view controller missing");
assert(js.includes("function renderNutritionNextAction"), "next action renderer missing");
assert(js.includes('title: "Set your fueling baseline"'), "baseline setup priority missing");
assert(css.includes(".nutrition-workspace-panel[hidden]{display:none!important}"), "hidden panel contract missing");
assert(css.includes(".nav-group-label"), "grouped navigation styles missing");

console.log("Unified command UX tests passed.");
