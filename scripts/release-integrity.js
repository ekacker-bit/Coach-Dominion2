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
check("fuel command engine", size("assets/js/fuel-command.js") >= 6500 && read("assets/js/fuel-command.js").includes('const VERSION = "023F.1"'), "023F Fuel engine appears incomplete");
check("fuel calendar engine", size("assets/js/fuel-calendar.js") >= 5000 && read("assets/js/fuel-calendar.js").includes('const VERSION = "023B.1"'), "023B calendar context engine appears incomplete");
check("fuel calendar integration", app.includes("buildCurrentFuelCalendarContext") && app.includes('class="fuel-calendar-brief'), "023B calendar-aware Fuel integration is missing");
check("fasting protocol engine", size("assets/js/intermittent-fasting.js") >= 8500 && read("assets/js/intermittent-fasting.js").includes('const VERSION = "023D.1"'), "023D fasting protocol engine appears incomplete");
check("fasting protocol integration", html.includes('id="intermittent-fasting-form"') && app.includes("buildCurrentFastingContext") && app.includes('class="fuel-fasting-brief'), "023D fasting protocol integration is missing");
check("fasting execution engine", size("assets/js/fasting-execution.js") >= 12000 && read("assets/js/fasting-execution.js").includes('const VERSION = "023D.1"'), "023D fasting execution engine appears incomplete");
check("fasting execution UI", html.includes('id="fasting-execution-panel"') && html.includes('id="fasting-closeout-form"') && app.includes("handleFastingExecutionAction") && app.includes("renderFastingReview"), "023D fasting execution or review UI is missing");
check("fasting execution persistence", app.includes('persistNutritionState("FASTING_EXECUTION"') && app.includes("writeFastingExecutionLedger"), "023D fasting execution persistence is missing");
check("meal execution engine", size("assets/js/meal-execution.js") >= 12000 && read("assets/js/meal-execution.js").includes('const VERSION = "023F.1"'), "023F meal execution engine appears incomplete");
check("meal execution UI", html.includes('id="meal-execution-panel"') && html.includes('id="meal-confirm-form"') && app.includes("renderMealExecution") && app.includes("confirmMealExecution"), "023E meal execution UI is missing");
check("meal execution persistence", app.includes('persistNutritionState("MEAL_EXECUTION"') && app.includes("writeMealExecutionLedger"), "023E meal execution persistence is missing");
check("fuel closed loop engine", size("assets/js/fuel-closed-loop.js") >= 14000 && read("assets/js/fuel-closed-loop.js").includes('const VERSION = "023F.1"'), "023F Fuel closed-loop engine appears incomplete");
check("fuel closed loop UI", html.includes('id="fuel-closed-loop-panel"') && html.includes('id="fuel-meal-feedback-form"') && html.includes('id="fuel-day-closeout-form"') && app.includes("renderFuelClosedLoop") && app.includes("sealFuelDay"), "023F Fuel closeout UI is missing");
check("fuel closed loop persistence", app.includes('persistNutritionState("FUEL_CLOSED_LOOP"') && app.includes("writeFuelClosedLoopLedger"), "023F Fuel closeout persistence is missing");
check("fuel closed loop review", html.includes('id="fuel-loop-review-output"') && app.includes("renderFuelLoopReview"), "023F Fuel feedback review is missing");
check("Atlas program engine", size("assets/js/atlas-program.js") >= 5000 && read("assets/js/atlas-program.js").includes('const VERSION = "024A.1"'), "024A program engine appears incomplete");
check("Atlas program integration", html.includes('/assets/js/atlas-program.js?v=024a') && app.includes("approveAtlasProgram") && app.includes("APPROVE_PROGRAM"), "024A one-approval program flow is missing");
check("Atlas recruit profile", html.includes('name="weightValue"') && read("assets/js/recruit-contract.js").includes('const VERSION = "024A.1"'), "024A recruit inputs are incomplete");
check("Atlas activation engine", size("assets/js/atlas-activation.js") >= 9000 && read("assets/js/atlas-activation.js").includes('const VERSION = "024B.1"'), "024B activation engine appears incomplete");
check("Atlas activation integration", html.includes('/assets/js/atlas-activation.js?v=024b') && app.includes("buildAtlasProgramPreflight") && app.includes("snapshotAtlasActivationState"), "024B atomic activation flow is missing");
check("Program Command engine", size("assets/js/program-command.js") >= 9000 && read("assets/js/program-command.js").includes('const VERSION = "024C.1"'), "024C Program Command engine appears incomplete");
check("Program Command integration", html.includes('id="program"') && html.includes('/assets/js/program-command.js?v=024c') && app.includes("renderProgramCommand") && app.includes("renderProgramChangeImpact"), "024C Program Command Center is missing");
check("Atlas calendar engine", size("assets/js/weekly-orchestrator.js") >= 30000 && read("assets/js/weekly-orchestrator.js").includes('const VERSION = "024D.1"'), "024D calendar engine appears incomplete");
check("Atlas calendar integration", html.includes('/assets/js/weekly-orchestrator.js?v=024d') && app.includes('"activate-program"') && app.includes("buildAtlasProgramPreflight"), "024D Atlas calendar handoff is missing");
check("stylesheet version", html.includes('/assets/styles.css?v=024d'), "app.html is not using the 024D stylesheet");
check("application version", html.includes('/assets/js/app.js?v=024d'), "app.html is not using the 024D application");
check("cache version", worker.includes('coach-dominion-024d-v1'), "service-worker cache was not rotated");
check("cached stylesheet", worker.includes('/assets/styles.css?v=024d'), "service worker is caching the wrong stylesheet");
check("cached application", worker.includes('/assets/js/app.js?v=024d'), "service worker is caching the wrong application");
check("cached Atlas calendar", worker.includes('/assets/js/weekly-orchestrator.js?v=024d'), "service worker is not caching the Atlas calendar engine");
check("cached Atlas program", worker.includes('/assets/js/atlas-program.js?v=024a'), "service worker is not caching the Atlas program engine");
check("cached Atlas activation", worker.includes('/assets/js/atlas-activation.js?v=024b'), "service worker is not caching the Atlas activation engine");
check("cached Program Command", worker.includes('/assets/js/program-command.js?v=024c'), "service worker is not caching the Program Command engine");
check("cached fuel calendar", worker.includes('/assets/js/fuel-calendar.js?v=023b'), "service worker is not caching the calendar context engine");
check("cached fasting protocol", worker.includes('/assets/js/intermittent-fasting.js?v=023d'), "service worker is not caching the fasting protocol engine");
check("cached fasting execution", worker.includes('/assets/js/fasting-execution.js?v=023d'), "service worker is not caching the fasting execution engine");
check("cached meal execution", worker.includes('/assets/js/meal-execution.js?v=023f'), "service worker is not caching the meal execution engine");
check("cached fuel closed loop", worker.includes('/assets/js/fuel-closed-loop.js?v=023f'), "service worker is not caching the Fuel closed-loop engine");
check("cached fuel command", worker.includes('/assets/js/fuel-command.js?v=023f'), "service worker is not caching the Fuel engine");
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
