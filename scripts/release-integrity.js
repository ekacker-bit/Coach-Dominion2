const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const size = (file) => fs.statSync(path.join(root, file)).size;

const html = read("app.html");
const css = read("assets/styles.css");
const app = read("assets/js/app.js");
const worker = read("sw.js");
const failures = [];

function check(label, condition, detail) {
  if (!condition) failures.push(`${label}: ${detail}`);
}

check("app shell", size("app.html") >= 110000, `app.html is only ${size("app.html")} bytes`);
check("application", size("assets/js/app.js") >= 900000, `app.js is only ${size("assets/js/app.js")} bytes`);
check("stylesheet", size("assets/styles.css") >= 260000, `styles.css is only ${size("assets/styles.css")} bytes`);
check("stylesheet lines", css.split("\n").length >= 5500, "responsive stylesheet appears incomplete");
check("responsive rules", css.includes("@media (max-width: 720px)"), "phone breakpoint is missing");
check("brand proportions", css.includes(".dominion-brand-mark") && css.includes("object-fit: contain"), "brand sizing guardrails are missing");
check("product polish", app.includes('document.body.dataset.productPolish = "021O"'), "021O word-diet layer is missing");
check("copy observer", app.includes("startProductPolishObserver"), "dynamic copy cleanup is missing");
check("Atlas intervention", html.includes('id="adaptive-coaching"') && app.includes("DominionAtlasIntervention.buildIntervention"), "022A coaching call is missing");
check("intervention engine", size("assets/js/atlas-intervention.js") >= 7000, "022A intervention engine appears incomplete");
check("body progress", html.includes('id="body-photo-progress"') && app.includes("uploadBodyProgressPhotos"), "022B photo checkpoint is missing");
check("body progress engine", size("assets/js/body-progress.js") >= 6000, "022B body progress engine appears incomplete");
check("private photo migration", size("supabase/migrations/027_body_progress_photos.sql") >= 3000, "022B private photo migration appears incomplete");
check("progress review", html.includes('class="progress-review-surface"') && app.includes("buildCurrentProgressReview"), "022C progress review is missing");
check("progress review engine", size("assets/js/progress-review.js") >= 12000, "022C progress review engine appears incomplete");
check("progress approval", app.includes("resolveProgressReviewAction") && app.includes("saveProgressReview"), "022C approval loop is missing");
check("plan command", html.includes('id="body-plan-command"') && app.includes("buildCurrentPlanCommand"), "022D plan command is missing");
check("plan command engine", size("assets/js/plan-command.js") >= 15000, "022D plan command engine appears incomplete");
check("plan command persistence", app.includes('"plan-command-current"') && app.includes("savePlanCommand"), "022D account persistence is missing");
check("plan command activation", app.includes("activateDuePlanCommand") && app.includes("rollbackPlanCommand"), "022D activation or rollback is missing");
check("stylesheet version", html.includes('/assets/styles.css?v=022d'), "app.html is not using the 022D stylesheet");
check("application version", html.includes('/assets/js/app.js?v=022d'), "app.html is not using the 022D application");
check("cache version", worker.includes('coach-dominion-022d-v1'), "service-worker cache was not rotated");
check("cached stylesheet", worker.includes('/assets/styles.css?v=022d'), "service worker is caching the wrong stylesheet");
check("cached application", worker.includes('/assets/js/app.js?v=022d'), "service worker is caching the wrong application");
check("cached intervention", worker.includes('/assets/js/atlas-intervention.js?v=022a'), "service worker is not caching the intervention engine");
check("cached body progress", worker.includes('/assets/js/body-progress.js?v=022b'), "service worker is not caching the body progress engine");
check("cached progress review", worker.includes('/assets/js/progress-review.js?v=022c'), "service worker is not caching the progress review engine");
check("cached plan command", worker.includes('/assets/js/plan-command.js?v=022d'), "service worker is not caching the plan command engine");

if (failures.length) {
  console.error("Release integrity failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Release integrity passed: ${size("app.html")}B HTML, ${size("assets/js/app.js")}B JS, ${size("assets/styles.css")}B CSS.`);
