module.exports = function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.status(200).json({
    ok: true,
    service: "coach-dominion",
    status: "ready",
    release: "029O.1",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    checks: {
      application: "available",
      trustTelemetry: "available",
      reliabilitySignals: "structured",
      productionCanary: "available",
      betaJourney: "available"
    }
  });
};
