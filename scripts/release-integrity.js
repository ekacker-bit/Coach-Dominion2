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
check("daily closeout", html.includes('id="daily-closeout-form"') && app.includes("submitDailyCloseout"), "022F daily closeout is missing");
check("daily closeout engine", size("assets/js/daily-closeout.js") >= 8000, "022F daily closeout engine appears incomplete");
check("daily closeout persistence", app.includes('persistClosedLoopState("CLOSEOUT", record.date, record)') && app.includes('"HISTORY", "daily-closeout"'), "022F closeout persistence is missing");
check("mobile field app", html.includes('id="mobile-more-dialog"') && app.includes("resolveMobileDestination(action)"), "022G mobile navigation is missing");
check("mobile field engine", read("assets/js/mobile-command.js").includes('const VERSION = "022G.1"'), "022G mobile engine is missing");
check("unified fuel command", html.includes('class="fuel-command-center"') && app.includes("DominionFuelCommand.buildFuelCommand"), "023D unified Fuel surface is missing");
check("fuel command engine", size("assets/js/fuel-command.js") >= 6500 && read("assets/js/fuel-command.js").includes('const VERSION = "023E.1"'), "023E Fuel engine appears incomplete");
check("fuel calendar engine", size("assets/js/fuel-calendar.js") >= 5000 && read("assets/js/fuel-calendar.js").includes('const VERSION = "023B.1"'), "023B calendar context engine appears incomplete");
check("fuel calendar integration", app.includes("buildCurrentFuelCalendarContext") && app.includes('class="fuel-calendar-brief'), "023B calendar-aware Fuel integration is missing");
check("fasting protocol engine", size("assets/js/intermittent-fasting.js") >= 8500 && read("assets/js/intermittent-fasting.js").includes('const VERSION = "023D.1"'), "023D fasting protocol engine appears incomplete");
check("fasting protocol integration", html.includes('id="intermittent-fasting-form"') && app.includes("buildCurrentFastingContext") && app.includes('class="fuel-fasting-brief'), "023D fasting protocol integration is missing");
check("fasting execution engine", size("assets/js/fasting-execution.js") >= 12000 && read("assets/js/fasting-execution.js").includes('const VERSION = "023D.1"'), "023D fasting execution engine appears incomplete");
check("fasting execution UI", html.includes('id="fasting-execution-panel"') && html.includes('id="fasting-closeout-form"') && app.includes("handleFastingExecutionAction") && app.includes("renderFastingReview"), "023D fasting execution or review UI is missing");
check("fasting execution persistence", app.includes('persistNutritionState("FASTING_EXECUTION"') && app.includes("writeFastingExecutionLedger"), "023D fasting execution persistence is missing");
check("meal execution engine", size("assets/js/meal-execution.js") >= 12000 && read("assets/js/meal-execution.js").includes('const VERSION = "023E.1"'), "023E meal execution engine appears incomplete");
check("meal execution UI", html.includes('id="meal-execution-panel"') && html.includes('id="meal-confirm-form"') && app.includes("renderMealExecution") && app.includes("confirmMealExecution"), "023E meal execution UI is missing");
check("meal execution persistence", app.includes('persistNutritionState("MEAL_EXECUTION"') && app.includes("writeMealExecutionLedger"), "023E meal execution persistence is missing");
check("stylesheet version", html.includes('/assets/styles.css?v=023e'), "app.html is not using the 023E stylesheet");
check("application version", html.includes('/assets/js/app.js?v=023e'), "app.html is not using the 023E application");
check("cache version", worker.includes('coach-dominion-023e-v1'), "service-worker cache was not rotated");
check("cached stylesheet", worker.includes('/assets/styles.css?v=023e'), "service worker is caching the wrong stylesheet");
check("cached application", worker.includes('/assets/js/app.js?v=023e'), "service worker is caching the wrong application");
check("cached fuel calendar", worker.includes('/assets/js/fuel-calendar.js?v=023b'), "service worker is not caching the calendar context engine");
check("cached fasting protocol", worker.includes('/assets/js/intermittent-fasting.js?v=023d'), "service worker is not caching the fasting protocol engine");
check("cached fasting execution", worker.includes('/assets/js/fasting-execution.js?v=023d'), "service worker is not caching the fasting execution engine");
check("cached meal execution", worker.includes('/assets/js/meal-execution.js?v=023e'), "service worker is not caching the meal execution engine");
check("cached fuel command", worker.includes('/assets/js/fuel-command.js?v=023e'), "service worker is not caching the Fuel engine");
check("cached intervention", worker.includes('/assets/js/atlas-intervention.js?v=022a'), "service worker is not caching the intervention engine");
check("cached body progress", worker.includes('/assets/js/body-progress.js?v=022b'), "service worker is not caching the body progress engine");
check("cached progress review", worker.includes('/assets/js/progress-review.js?v=022c'), "service worker is not caching the progress review engine");
check("cached plan command", worker.includes('/assets/js/plan-command.js?v=022d'), "service worker is not caching the plan command engine");
check("cached daily closeout", worker.includes('/assets/js/daily-closeout.js?v=022f'), "service worker is not caching the closeout engine");
check("cached mobile command", worker.includes('/assets/js/mobile-command.js?v=022g'), "service worker is not caching the mobile engine");

if (failures.length) {
  console.error("Release integrity failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Release integrity passed: ${size("app.html")}B HTML, ${size("assets/js/app.js")}B JS, ${size("assets/styles.css")}B CSS.`);
