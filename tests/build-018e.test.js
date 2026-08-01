const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const app = fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "assets", "styles.css"), "utf8");

assert.match(html, /BUILD 019A \/\/ THE DOMINION CONTRACT/);
assert.match(app, /function recruitContractNutritionConnection/);
assert.match(app, /DominionRecruitContract\.resolveNutritionPlanReadiness/);
assert.match(app, /data-recruit-contract-action="nutrition-plan"/);
assert.match(app, /Open nutrition plan/);
assert.match(app, /Set nutrition targets/);
assert.match(app, /function nutritionBaselineForUnifiedWeek/);
assert.match(app, /planningDateForWeek\(weekStart, todayISODate\(\)\)/);
assert.match(app, /function refreshUnifiedWeekDraftForNutrition/);
assert.match(app, /await refreshUnifiedWeekDraftForNutrition\(\)/);
assert.match(app, /renderRecruitContract\(\);\s*renderWeeklyOrchestrator\(\);/);
assert.match(styles, /\.recruit-contract-module-action/);

console.log("Build 018E nutrition contract linkage integration passed.");
