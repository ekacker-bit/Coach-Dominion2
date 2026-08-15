(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DominionRunningProgression = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "025S.1";
  const DECISIONS = new Set(["PROGRESS", "REPEAT", "REDUCE", "RECOVER", "COLLECT"]);

  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function dateIso(value) {
    const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  function stableHash(value) {
    const text = JSON.stringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function runEvidence(entry = {}) {
    if (String(entry.domain || "").toLowerCase() !== "running") return null;
    const metrics = entry.metrics || {};
    const distance = finite(metrics.distance);
    const durationSeconds = finite(metrics.duration_seconds ?? metrics.durationSeconds);
    if (!(distance > 0) || !(durationSeconds > 0)) return null;
    const completion = finite(metrics.completion_percent ?? metrics.completionPercent);
    const plannedDistance = finite(metrics.planned_distance ?? metrics.plannedDistance);
    return {
      id: entry.id || null,
      date: dateIso(entry.performanceDate || entry.performance_date),
      distance,
      unit: metrics.distance_unit || metrics.distanceUnit || "mi",
      durationSeconds,
      paceSecondsPerUnit: finite(metrics.pace_seconds_per_unit ?? metrics.paceSecondsPerUnit) || durationSeconds / distance,
      rpe: finite(metrics.rpe),
      plannedDistance,
      completionPercent: completion !== null ? completion : plannedDistance > 0 ? Math.round(distance / plannedDistance * 100) : null,
      verdictCode: String(metrics.verdict_code || metrics.verdictCode || "OBSERVED").toUpperCase(),
      runType: String(metrics.run_type || metrics.runType || metrics.session_type || "").toUpperCase(),
      pain: ["PAIN_HOLD", "SAFETY_REVIEW", "STOPPED"].includes(String(metrics.verdict_code || metrics.verdictCode || entry.status || "").toUpperCase())
    };
  }

  function blockBounds(block = {}) {
    const weeks = Array.isArray(block.weeks) ? block.weeks : [];
    return { start: weeks[0]?.weekStart || block.startDate || null, end: weeks.at(-1)?.weekEnd || block.endDate || null };
  }

  function buildProposal(input = {}) {
    const block = input.block || null;
    const today = dateIso(input.today) || new Date().toISOString().slice(0, 10);
    if (!block || block.status !== "APPROVED") {
      return { version: VERSION, status: "SETUP_REQUIRED", code: "COLLECT", tone: "neutral", headline: "Approve a Running plan", detail: "Atlas needs an active block before it can coach progression.", approvalRequired: false, evidence: { runs: 0 } };
    }
    const bounds = blockBounds(block);
    const progressionFloor = dateIso(block.runningProgression?.appliedAt);
    const runs = (input.entries || []).map(runEvidence).filter(Boolean)
      .filter((run) => (!bounds.start || run.date >= bounds.start) && (!bounds.end || run.date <= bounds.end) && (!progressionFloor || run.date > progressionFloor) && run.date <= today)
      .sort((left, right) => String(right.date).localeCompare(String(left.date))).slice(0, 8);
    const judged = runs.filter((run) => run.completionPercent !== null);
    const painRuns = runs.filter((run) => run.pain);
    const highEffort = runs.filter((run) => run.rpe !== null && run.rpe >= 9);
    const partial = judged.filter((run) => run.completionPercent < 90);
    const exceeded = judged.filter((run) => run.completionPercent > 115);
    const onTarget = judged.filter((run) => run.completionPercent >= 90 && run.completionPercent <= 115 && !run.pain);
    const averageCompletion = judged.length ? Math.round(judged.reduce((total, run) => total + run.completionPercent, 0) / judged.length) : null;
    const averageRpe = runs.filter((run) => run.rpe !== null).length
      ? Math.round(runs.filter((run) => run.rpe !== null).reduce((total, run) => total + run.rpe, 0) / runs.filter((run) => run.rpe !== null).length * 10) / 10
      : null;
    let code = "COLLECT";
    let tone = "neutral";
    let headline = "Keep building the record";
    let detail = "Complete at least two prescribed runs with distance and elapsed time before Atlas recommends a change.";
    let distanceDeltaPercent = 0;
    let durationDeltaPercent = 0;
    let paceDeltaSecondsPerUnit = 0;
    let progressionMode = "DURATION";
    if (painRuns.length) {
      code = "RECOVER"; tone = "red"; headline = "Hold Running progression";
      detail = "Pain evidence overrides volume and pace. Preserve the plan and clear recovery before another progression review.";
      distanceDeltaPercent = -20;
      durationDeltaPercent = -20;
    } else if (judged.length >= 2 && (partial.length >= 2 || highEffort.length >= 2)) {
      code = "REDUCE"; tone = "yellow"; headline = "Reduce the next Running dose";
      detail = "Repeated partial or high-effort results support a bounded reduction before more demand.";
      distanceDeltaPercent = -10;
      durationDeltaPercent = -10;
    } else if (judged.length >= 3 && onTarget.length >= 3 && !highEffort.length && !exceeded.length) {
      code = "PROGRESS"; tone = "green"; headline = "Progress the Running block";
      detail = "Three secured runs support a five-percent increase across future prescribed distance. Long runs remain uncapped by time.";
      const qualityRuns = onTarget.filter((run) => ["TEMPO", "INTERVAL"].includes(run.runType) && run.rpe !== null && run.rpe <= 7);
      if (qualityRuns.length >= 2) {
        progressionMode = "PACE";
        paceDeltaSecondsPerUnit = -5;
        detail = "Two controlled quality runs support a five-second pace step on future tempo and interval work while distance stays fixed.";
      } else {
        distanceDeltaPercent = 5;
        durationDeltaPercent = 5;
      }
    } else if (judged.length >= 2) {
      code = "REPEAT"; tone = exceeded.length || highEffort.length ? "yellow" : "neutral"; headline = "Repeat the current Running dose";
      detail = exceeded.length ? "Excess work was recorded. Repeat the approved dose while Atlas watches recovery." : "Evidence supports another exposure at the current dose before progression.";
    }
    const effectiveDate = today;
    const fingerprint = stableHash({ blockId: block.id, revision: block.revision, runIds: runs.map((run) => run.id), code, distanceDeltaPercent, durationDeltaPercent, paceDeltaSecondsPerUnit, progressionMode });
    const proposal = {
      version: VERSION,
      id: `running-progression:${block.id}:r${block.revision}:${fingerprint}`,
      status: code === "COLLECT" ? "COLLECTING" : "PROPOSED",
      code: DECISIONS.has(code) ? code : "COLLECT",
      tone,
      headline,
      detail,
      blockId: block.id,
      blockRevision: Number(block.revision || 1),
      effectiveDate,
      distanceDeltaPercent,
      durationDeltaPercent,
      paceDeltaSecondsPerUnit,
      progressionMode,
      unit: block.profile?.preferredUnit || block.weeks?.[0]?.sessions?.find((item) => item.unit)?.unit || "unit",
      approvalRequired: code !== "COLLECT",
      evidence: { runs: runs.length, judgedRuns: judged.length, onTarget: onTarget.length, partial: partial.length, exceeded: exceeded.length, pain: painRuns.length, highEffort: highEffort.length, averageCompletion, averageRpe, sourceIds: runs.map((run) => run.id).filter(Boolean) },
      safeguard: "The active plan and completed weeks remain unchanged until the recruit approves this future revision."
    };
    const prior = input.priorProposal;
    if (prior && prior.id === proposal.id && ["APPROVED", "HELD"].includes(prior.status)) return JSON.parse(JSON.stringify(prior));
    return proposal;
  }

  function approveProposal(proposal = {}, approvedAt = new Date().toISOString()) {
    if (proposal.status !== "PROPOSED" || !proposal.approvalRequired) throw new Error("No Running progression is awaiting approval.");
    return { ...proposal, status: "APPROVED", approvedAt, decision: proposal.code };
  }

  function holdProposal(proposal = {}, heldAt = new Date().toISOString()) {
    if (!proposal.id || !["PROPOSED", "APPROVED"].includes(proposal.status)) throw new Error("No Running progression is awaiting a decision.");
    return { ...proposal, status: "HELD", decision: "REPEAT", distanceDeltaPercent: 0, heldAt, headline: "Current Running plan retained", detail: "The recruit kept the approved dose. Atlas will review the next verified runs." };
  }

  function applyToBlock(block = {}, decision = {}, options = {}) {
    if (block.status !== "APPROVED" || decision.status !== "APPROVED") throw new Error("Approve the Running decision before revising the block.");
    if (decision.blockId !== block.id || Number(decision.blockRevision) !== Number(block.revision || 1)) throw new Error("The Running decision belongs to another plan revision.");
    const appliedAt = options.appliedAt || new Date().toISOString();
    const factor = 1 + Number(decision.distanceDeltaPercent || 0) / 100;
    const weeks = (block.weeks || []).map((week) => ({
      ...week,
      sessions: (week.sessions || []).map((session) => {
        if (session.type === "REST" || session.date <= decision.effectiveDate || !session.distance) return { ...session };
        const paceEligible = decision.progressionMode === "PACE" && ["TEMPO", "INTERVAL"].includes(session.type);
        const distance = Number(Math.max(0.1, session.distance * factor).toFixed(1));
        return {
          ...session,
          distance,
          paceFast: paceEligible && session.paceFast ? Math.max(1, Number(session.paceFast) + Number(decision.paceDeltaSecondsPerUnit || 0)) : session.paceFast,
          paceSlow: paceEligible && session.paceSlow ? Math.max(1, Number(session.paceSlow) + Number(decision.paceDeltaSecondsPerUnit || 0)) : session.paceSlow,
          estimatedMinutes: Math.max(1, Math.round(Number(session.estimatedMinutes || 0) * (1 + Number(decision.durationDeltaPercent || 0) / 100))),
          durationCapMinutes: session.type === "LONG" ? null : session.durationCapMinutes,
          durationPolicy: session.type === "LONG" ? "UNCAPPED_BY_TIME" : session.durationPolicy,
          runningProgression: { decisionId: decision.id, code: decision.code, progressionMode: decision.progressionMode, distanceDeltaPercent: decision.distanceDeltaPercent, durationDeltaPercent: decision.durationDeltaPercent, paceDeltaSecondsPerUnit: decision.paceDeltaSecondsPerUnit }
        };
      })
    })).map((week) => ({ ...week, weeklyDistance: Number((week.sessions || []).reduce((total, session) => total + Number(session.distance || 0), 0).toFixed(1)) }));
    return {
      ...block,
      id: `${block.id}:p${Number(block.revision || 1) + 1}`,
      revision: Number(block.revision || 1) + 1,
      approvedAt: appliedAt,
      supersedesId: block.id,
      weeks,
      runningProgression: { decisionId: decision.id, code: decision.code, appliedAt, sourceBlockId: block.id, sourceBlockRevision: block.revision },
      message: decision.distanceDeltaPercent ? `${decision.headline} is active across future runs.` : "The current Running dose is retained."
    };
  }

  return Object.freeze({ VERSION, runEvidence, buildProposal, approveProposal, holdProposal, applyToBlock });
});
