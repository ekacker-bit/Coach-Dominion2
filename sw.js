const CACHE_NAME = "coach-dominion-025c-v1-025h-025i-025j-025k-025l-025m-025n-025o-025p-025q-025r-025s-025t-025u-025v-025w-025x-025y-025z-026a-026bc-026d-026e-026g-026h-026i-026j-026k-026l-027a-027b-027c-027d-027e-027f-028a-028b-028c-028d-028e-028f-029a-029b-029c-029d-029e-029f-029g2-029h-029l-029n-029o-030a-030b-030c-030d-030e1";
// Current release marker: coach-dominion-030e-authoritative-startup
// Prior release marker: coach-dominion-030d-recruit-journey-certification
// Prior release marker: coach-dominion-030c-daily-command-integrity
// Prior release marker: coach-dominion-030b-today-in-15-seconds
// Prior release marker: coach-dominion-030a-real-recruit-certification
// Prior release marker: coach-dominion-029o-beta-journey-certification
// Prior release marker: coach-dominion-029n-contract-reconciliation
// Prior release marker: coach-dominion-029l-production-reliability
// Prior release marker: coach-dominion-029h-beta-readiness
// Prior release marker: coach-dominion-029g-final-beta-stabilization
// Prior release marker: coach-dominion-029f-honest-connections
// Legacy release marker retained for upgrade-path verification: coach-dominion-028f-release-stabilization
const APP_SHELL = [
  "/",
  "/app",
  "/app.html",
  "/manifest.webmanifest",
  "/assets/styles.css?v=025q",
  "/assets/styles.css?v=025c3-025i-025j-025k-025l-025m-025n-025o-025p-025q-025r-025s-025t-025u-025v-025w-025x-025y-025z-026a-026bc-026d-026e-026g-026h-026i-026j-026k-026l-027a-027b-027c-027d-027e-027f-028a-028b-028c-028d-028e-028f-029a-029d-029f-029g-029n-030b-030c-030d1-030e1",
  "/assets/icons/dominion-mark.svg",
  "/assets/js/connected.js?v=027d",
  "/assets/js/connected-evidence.js?v=027d",
  "/assets/js/nutrition-feed.js",
  "/assets/js/programming.js",
  "/assets/js/strength-training.js?v=025g-025i-025j",
  "/assets/js/strength-calendar-handoff.js?v=025k-025l",
  "/assets/js/strength-progression-trial.js?v=025l",
  "/assets/js/strength-schedule.js",
  "/assets/js/strength-week-review.js",
  "/assets/js/strength-intelligence.js",
  "/assets/js/strength-block.js",
  "/assets/js/recovery.js",
  "/assets/js/daily-coaching.js",
  "/assets/js/daily-assignment.js",
  "/assets/js/readiness-baselines.js?v=030e",
  "/assets/js/weekly-plan.js",
  "/assets/js/nutrition-command.js",
  "/assets/js/adaptive-fueling.js",
  "/assets/js/nutrition-intelligence.js",
  "/assets/js/body-progress.js?v=022b",
  "/assets/js/body-composition.js?v=022b",
  "/assets/js/trends-intelligence.js?v=025m",
  "/assets/js/transformation-ledger.js?v=028e",
  "/assets/js/progress-review.js?v=022c",
  "/assets/js/plan-command.js?v=022d",
  "/assets/js/observation-verdict.js?v=022e",
  "/assets/js/daily-closeout.js?v=022f",
  "/assets/js/nutrition-baseline.js",
  "/assets/js/nutrition-review.js",
  "/assets/js/meal-coaching.js",
  "/assets/js/intermittent-fasting.js?v=023d",
  "/assets/js/fasting-execution.js?v=023d",
  "/assets/js/fuel-calendar.js?v=023b",
  "/assets/js/today-nutrition.js",
  "/assets/js/meal-execution.js?v=023f",
  "/assets/js/fuel-closed-loop.js?v=023f",
  "/assets/js/fuel-command.js?v=023f",
  "/assets/js/running-command.js",
  "/assets/js/core-programming.js?v=013c2",
  "/assets/js/closed-loop.js",
  "/assets/js/adaptive-coaching.js?v=025a",
  "/assets/js/atlas-intervention.js?v=022a",
  "/assets/js/recruit-contract.js?v=024a",
  "/assets/js/contract-experience.js",
  "/assets/js/weekly-orchestrator.js?v=024d",
  "/assets/js/split-day-command.js",
  "/assets/js/contract-activation.js?v=024a",
  "/assets/js/atlas-program.js?v=024f2",
  "/assets/js/atlas-activation.js?v=024m",
  "/assets/js/atlas-program-repair.js?v=024f",
  "/assets/js/program-command.js?v=024c",
  "/assets/js/atlas-adaptive-week.js?v=025a2",
  "/assets/js/atlas-week-autopilot.js?v=024n",
  "/assets/js/mission-execution.js?v=025b",
  "/assets/js/manual-run.js?v=030e",
  "/assets/js/running-verdict.js?v=025r",
  "/assets/js/running-progression.js?v=025s",
  "/assets/js/fuel-execution.js?v=025t",
  "/assets/js/atlas-weekly-command.js?v=025u",
  "/assets/js/weekly-replanning.js?v=028d",
  // Legacy release-integrity marker: /assets/js/atlas-decision-center.js?v=025v
  "/assets/js/atlas-decision-center.js?v=025w",
  "/assets/js/atlas-resolution-loop.js?v=025x",
  "/assets/js/recruit-constraint-memory.js?v=025y",
  "/assets/js/program-recovery.js?v=025z",
  "/assets/js/mission-debrief.js?v=025c",
  "/assets/js/mission-recovery.js?v=025d",
  "/assets/js/morning-verification.js?v=025e",
  "/assets/js/contract-integrity.js",
  "/assets/js/contract-autosave.js",
  "/assets/js/mobile-command.js?v=022g",
  "/assets/js/experience-shell.js",
  "/assets/js/daily-ritual.js?v=022f",
  "/assets/js/operating-truth.js?v=025h-030c",
  "/assets/js/activation-repair.js?v=024f",
  "/assets/js/one-command.js",
  "/assets/js/atlas-daily-command.js?v=025o-028c",
  "/assets/js/atlas-coach.js?v=028c",
  "/assets/js/daily-decision.js?v=026e",
  "/assets/js/release-stabilization.js?v=028f",
  "/assets/js/final-beta-stabilization.js?v=029g",
  "/assets/js/connected-health.js?v=029f",
  "/assets/js/canonical-daily-command.js?v=029b",
  "/assets/js/program-lifecycle.js?v=029e",
  "/assets/js/daily-decision-integrity.js?v=027f-028f-029n-030c",
  "/assets/js/mission-execution-spine.js?v=026b",
  "/assets/js/atlas-live-adaptation.js?v=026c-029g",
  "/assets/js/atlas-adaptive-horizon.js?v=026g",
  "/assets/js/atlas-adaptation-outcomes.js?v=026h",
  "/assets/js/weekly-advancement.js?v=026d-030c-030e",
  "/assets/js/unified-blocker-resolution.js?v=025p-029n",
  "/assets/js/dominion-continuity.js?v=025n",
  "/assets/js/contract-reconciliation.js?v=029n",
  "/assets/js/dominion-account-truth.js?v=026i-029n-030d-030e",
  "/assets/js/account-persistence.js?v=029c-029g-029n-030c-030e",
  "/assets/js/command-first-today.js?v=029d",
  "/assets/js/trust-layer.js?v=028a-029l",
  "/assets/js/beta-readiness-gate.js?v=029h",
  "/assets/js/beta-journey-certification.js?v=029o-030a-030d",
  "/assets/js/journey-continuity.js?v=030d",
  "/assets/js/startup-authority.js?v=030e",
  "/assets/js/assignment-evidence-state.js?v=030e",
  "/assets/js/calendar-commit-authority.js?v=030e",
  "/assets/js/operational-time.js?v=030e",
  "/assets/js/frictionless-execution.js?v=028b",
  "/assets/js/today-quick-log.js?v=030b",
  "/assets/js/execution-context.js?v=030c",
  "/assets/js/biometric-integrity.js?v=030c",
  "/assets/js/account-entry.js?v=029a",
  "/assets/js/evidence-autopilot.js?v=026j",
  "/assets/js/dominion-campaign.js?v=026k-029g",
  "/assets/js/campaign-verdict.js?v=027e",
  "/assets/js/fuel-day-ledger.js?v=026l",
  "/assets/js/campaign-commissioning.js?v=027a",
  "/assets/js/atlas-progression-engine.js?v=027b",
  "/assets/js/recovery-command.js?v=027c",
  "/assets/js/first-week-orientation.js?v=025q",
  "/assets/js/app.js?v=025c7-025h-025i-025j-025k-025l-025m-025n-025o-025p-025q-025r-025s-025t-025u-025v-025w-025x-025y-025z-026a-026bc-026d-026e-026g-026h-026i-026j-026k-026l-027a-027b-027c-027d-027e-027f-028a-028b-028c-028d-028e-028f-029a-029b-029c-029d-029e-029f-029g2-029h-029l-029n-029o-030a-030b-030c-030d-030e"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("coach-dominion-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/app.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refreshed = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || refreshed;
    })
  );
});
