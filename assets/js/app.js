let client;
let session;
let dailyState;
let dailyCompliance;

const DAILY_STATE_COLUMNS = "date,energy,soreness,pain,sleep,weight,steps,resting_heart_rate,confidence,comments";
const COMPLIANCE_DOMAINS = ["mission", "strength", "cardio", "recovery", "nutrition"];
const COMPLIANCE_DOMAIN_LABELS = {
  mission: "Mission Compliance",
  strength: "Strength Compliance",
  cardio: "Running/Cardio Compliance",
  recovery: "Recovery Compliance",
  nutrition: "Nutrition Compliance"
};
const COMPLIANCE_STATUS_SCORES = { completed: 100, partial: 50, missed: 0 };
const COMPLIANCE_EXCLUDED_STATUSES = new Set(["excused", "not_applicable"]);
const COMPLIANCE_COLUMNS = [
  "compliance_date", "discipline_score", "score_evidence", "updated_at",
  ...COMPLIANCE_DOMAINS.flatMap((domain) => [
    `${domain}_status`, `${domain}_target`, `${domain}_actual`, `${domain}_note`,
    `${domain}_restriction`, `${domain}_approved_modification`
  ])
].join(",");

const readinessClass = {
  RED: "red",
  YELLOW: "yellow",
  GREEN: "green"
};

const readinessSeverity = {
  RED: "CRITICAL",
  YELLOW: "WARNING",
  GREEN: "SUCCESS"
};

function todayISODate() {
  return new Date().toLocaleDateString("en-CA");
}

const READINESS_EVIDENCE_WEIGHTS = {
  energy: 0.20,
  soreness: 0.20,
  pain: 0.20,
  sleep: 0.15,
  resting_heart_rate: 0.15,
  weight: 0.05,
  steps: 0.05
};

const evidenceLabels = {
  energy: "Energy",
  soreness: "Soreness",
  pain: "Pain",
  sleep: "Sleep",
  resting_heart_rate: "Resting heart rate",
  weight: "Weight",
  steps: "Steps"
};

function isAvailable(value) {
  return value !== null && value !== undefined && value !== "";
}

function calculateConfidence(state) {
  if (!state) return 0;
  const total = Object.entries(READINESS_EVIDENCE_WEIGHTS).reduce((sum, [key, weight]) => {
    if (key === "pain") return sum + (typeof state.pain === "boolean" ? weight : 0);
    return sum + (isAvailable(state[key]) ? weight : 0);
  }, 0);
  return Math.max(0, Math.min(1, Number(total.toFixed(2))));
}

function evidenceValue(key, state) {
  if (!state || (key === "pain" && typeof state.pain !== "boolean") || (key !== "pain" && !isAvailable(state[key]))) {
    return "Not available";
  }
  if (key === "pain") return state.pain ? "Yes" : "No";
  if (key === "energy" || key === "soreness") return `${state[key]}/10`;
  if (key === "sleep") return `${state[key]}h`;
  if (key === "resting_heart_rate") return `${state[key]} bpm`;
  return String(state[key]);
}

function evaluateReadiness(state) {
  if (!state) {
    return {
      state: null,
      confidence: 0,
      headline: "Daily State not submitted.",
      rationale: ["Submit Energy, Soreness, and Pain to calculate readiness."],
      evidence: Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => ({
        key,
        label: evidenceLabels[key],
        status: "missing",
        value: "Not available",
        impact: `Confidence reduced by ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}%.`
      })),
      missingEvidence: Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => evidenceLabels[key]),
      primaryRisk: "Operating without current readiness.",
      instruction: "Complete Morning Roll Call.",
      restrictions: ["Awaiting roll call"]
    };
  }

  const painAvailable = typeof state.pain === "boolean";
  const energyAvailable = isAvailable(state.energy);
  const sorenessAvailable = isAvailable(state.soreness);
  const painReported = painAvailable && state.pain;
  const energyGreen = energyAvailable && Number(state.energy) >= 7;
  const sorenessGreen = sorenessAvailable && Number(state.soreness) <= 4;
  let readinessState = "YELLOW";

  if (painReported) readinessState = "RED";
  else if (energyGreen && sorenessGreen && painAvailable) readinessState = "GREEN";

  const copy = {
    GREEN: {
      headline: "Recovery capacity acceptable.",
      primaryRisk: "Unauthorized additional volume.",
      instruction: "Execute the prescribed mission exactly.",
      restrictions: ["No unplanned extra volume", "Do not add intensity outside the mission"]
    },
    YELLOW: {
      headline: "Readiness is reduced.",
      primaryRisk: "Excess intensity or volume.",
      instruction: "Complete primary work only.",
      restrictions: ["Remove optional intensity", "No additional volume", "Stop if symptoms worsen"]
    },
    RED: {
      headline: "Pain overrides performance goals.",
      primaryRisk: "Aggravating pain or injury.",
      instruction: "Execute recovery protocol.",
      restrictions: ["No hard training", "No testing pain", "Seek professional assessment if pain is significant, worsening, or persistent"]
    }
  }[readinessState];

  const rationale = [];
  if (readinessState === "RED") {
    rationale.push("Pain was reported.", "Hard training is not authorized.");
  } else {
    rationale.push("No pain reported.");
    if (energyGreen) rationale.push("Energy is at or above the GREEN threshold.");
    else rationale.push("Energy is below the GREEN threshold.");
    if (sorenessGreen) rationale.push("Soreness is at or below the GREEN ceiling.");
    else rationale.push("Soreness is above the GREEN ceiling.");
  }

  const evidence = Object.keys(READINESS_EVIDENCE_WEIGHTS).map((key) => {
    const missing = key === "pain" ? !painAvailable : !isAvailable(state[key]);
    if (missing) {
      return { key, label: evidenceLabels[key], status: "missing", value: "Not available", impact: `Confidence reduced by ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}%.` };
    }
    if (key === "energy") return { key, label: evidenceLabels[key], status: energyGreen ? "positive" : "negative", value: evidenceValue(key, state), impact: energyGreen ? "Meets GREEN threshold." : "Below GREEN threshold." };
    if (key === "soreness") return { key, label: evidenceLabels[key], status: sorenessGreen ? "positive" : "negative", value: evidenceValue(key, state), impact: sorenessGreen ? "Below GREEN ceiling." : "Above GREEN ceiling." };
    if (key === "pain") return { key, label: evidenceLabels[key], status: painReported ? "negative" : "positive", value: evidenceValue(key, state), impact: painReported ? "Pain override selected RED." : "No pain override." };
    return { key, label: evidenceLabels[key], status: "neutral", value: evidenceValue(key, state), impact: `Available; adds ${Math.round(READINESS_EVIDENCE_WEIGHTS[key] * 100)}% confidence only.` };
  });

  return {
    state: readinessState,
    confidence: calculateConfidence(state),
    headline: copy.headline,
    rationale,
    evidence,
    missingEvidence: evidence.filter((item) => item.status === "missing").map((item) => item.label),
    primaryRisk: copy.primaryRisk,
    instruction: copy.instruction,
    restrictions: copy.restrictions
  };
}

function calculateReadiness(state) {
  return evaluateReadiness(state).state;
}

function generateMission(readinessResultOrState) {
  const readiness = typeof readinessResultOrState === "string" ? readinessResultOrState : readinessResultOrState.state;
  if (readiness === "RED") {
    return {
      title: "Recovery mission",
      detail: "Remove hard training and protect recovery. Execute recovery protocol.",
      restrictions: "No hard training, no testing pain",
      generatedFromReadiness: readiness
    };
  }

  if (readiness === "YELLOW") {
    return {
      title: "Reduced mission",
      detail: "Complete primary work only and remove optional intensity.",
      restrictions: "No extra volume",
      generatedFromReadiness: readiness
    };
  }

  return {
    title: "Execute prescribed session",
    detail: "Proceed exactly as written. Execute the prescribed mission exactly.",
    restrictions: "No unauthorized volume",
    generatedFromReadiness: readiness
  };
}

function generateMorningBrief(readinessResult) {
  const result = readinessResult || evaluateReadiness(null);
  const commandState = result.state === "GREEN"
    ? "MISSION AUTHORIZED"
    : result.state === "YELLOW"
      ? "MISSION REDUCED"
      : result.state === "RED"
        ? "HARD TRAINING DENIED"
        : "ROLL CALL REQUIRED";
  const mission = result.state ? generateMission(result) : null;
  const missingEvidence = Array.isArray(result.missingEvidence) ? result.missingEvidence : [];
  const restrictions = Array.isArray(result.restrictions) ? result.restrictions : [];
  const primaryReason = Array.isArray(result.rationale) && result.rationale.length
    ? result.rationale[0]
    : result.headline;
  const authorization = result.state === "GREEN"
    ? "AUTHORIZED"
    : result.state === "YELLOW"
      ? "AUTHORIZED WITH REDUCTIONS"
      : "NOT AUTHORIZED";

  return {
    title: "ATLAS // MORNING BRIEF",
    commandState,
    authorization,
    readiness: result.state || "NOT ESTABLISHED",
    confidence: result.confidence || 0,
    primaryReason,
    risk: result.primaryRisk,
    missingEvidence,
    directive: result.instruction,
    commandNote: result.headline,
    orders: mission
      ? [mission.title, mission.detail]
      : ["Complete Morning Roll Call before mission generation."],
    restrictions,
    mission
  };
}

function formatAtlasBriefVoice(brief) {
  const confidence = `${Math.round(Number(brief.confidence || 0) * 100)}%`;
  const missing = brief.missingEvidence.length ? brief.missingEvidence.join(", ") : "None";
  const orders = brief.orders.map((order) => `- ${order}`).join("\n");
  const restrictions = brief.restrictions.map((restriction) => `- ${restriction}`).join("\n");

  return [
    brief.title,
    "",
    "STATUS",
    `${brief.commandState} // Mission: ${brief.authorization}`,
    `Readiness: ${brief.readiness} // Confidence: ${confidence}`,
    `Primary reason: ${brief.primaryReason}`,
    "",
    "DIRECTIVE",
    brief.directive,
    "",
    "COMMAND NOTE",
    `${brief.commandNote} Risk: ${brief.risk} Missing evidence: ${missing}.`,
    "",
    "ORDERS",
    orders,
    "",
    "RESTRICTIONS",
    restrictions || "- None"
  ].join("\n");
}

function normalizeComplianceStatus(status) {
  if (typeof status !== "string") return null;
  const normalized = status.trim().toLowerCase().replaceAll(" ", "_").replaceAll("n/a", "not_applicable");
  return Object.hasOwn(COMPLIANCE_STATUS_SCORES, normalized) || COMPLIANCE_EXCLUDED_STATUSES.has(normalized)
    ? normalized
    : null;
}

function scoreComplianceDomain(domain = {}) {
  const status = normalizeComplianceStatus(domain.status);
  if (status && Object.hasOwn(COMPLIANCE_STATUS_SCORES, status)) {
    return { status, included: true, score: COMPLIANCE_STATUS_SCORES[status], reason: "Included in equal-weight score." };
  }
  if (status === "excused") {
    return { status, included: false, score: null, reason: domain.restriction ? `Excused: ${domain.restriction}` : "Excused; excluded from score." };
  }
  if (status === "not_applicable") {
    return { status, included: false, score: null, reason: "Not applicable; excluded from score." };
  }
  return { status: null, included: false, score: null, reason: "Not assessed; no completion credit assigned." };
}

function calculateDisciplineScore(domains = {}) {
  const evidence = COMPLIANCE_DOMAINS.map((key) => {
    const domain = domains[key] || {};
    const weight = Number.isFinite(domain.weight) && domain.weight > 0 ? domain.weight : 1;
    return { key, label: COMPLIANCE_DOMAIN_LABELS[key], weight, ...scoreComplianceDomain(domain) };
  });
  const included = evidence.filter((item) => item.included);
  const totalWeight = included.reduce((total, item) => total + item.weight, 0);
  const score = included.length
    ? included.reduce((total, item) => total + (item.score * item.weight), 0) / totalWeight
    : null;
  return { score, includedCount: included.length, excludedCount: evidence.length - included.length, totalWeight, evidence };
}

function formatDisciplineScore(score) {
  return score === null || score === undefined ? "UNSCORED" : `${Math.round(score)}%`;
}

function buildComplianceExplanation(calculation) {
  const included = calculation.evidence
    .filter((item) => item.included)
    .map((item) => `${item.label}: ${item.status} (${item.score})`);
  const excluded = calculation.evidence
    .filter((item) => !item.included)
    .map((item) => `${item.label}: ${item.status || "not assessed"} — ${item.reason}`);
  const formula = included.length
    ? `Applicable weighted average (current weights are 1): (${calculation.evidence.filter((item) => item.included).map((item) => `${item.score} × ${item.weight}`).join(" + ")}) / ${calculation.totalWeight} = ${calculation.score}`
    : "No applicable assessed domains; no Discipline Score calculated.";
  return { formula, included, excluded };
}

function deriveDailyComplianceState(domains = {}) {
  const calculation = calculateDisciplineScore(domains);
  const complianceStatus = calculation.score === null
    ? "UNSCORED"
    : calculation.score === 100
      ? "FULL COMPLIANCE"
      : calculation.score === 0
        ? "NO RECORDED COMPLETION"
        : "PARTIAL COMPLIANCE";
  return {
    ...calculation,
    displayScore: formatDisciplineScore(calculation.score),
    complianceStatus,
    explanation: buildComplianceExplanation(calculation),
    violations: []
  };
}

async function getClient() {
  if (client) return client;
  const response = await fetch("/api/config");
  const config = await response.json();
  if (!config.ok) throw new Error(config.error || "Configuration unavailable.");
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  return client;
}

function setStatus(message) {
  document.getElementById("status").textContent = message || "";
}

function setLoading(isLoading) {
  document.getElementById("app-content").hidden = isLoading;
  document.getElementById("loading").hidden = !isLoading;
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function confidencePercent(confidence) {
  return `${Math.round(Number(confidence || 0) * 100)}%`;
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function valueOrDash(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function setList(id, values, emptyText) {
  const list = document.getElementById(id);
  clearElement(list);
  const items = values.length ? values : [emptyText];
  items.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.appendChild(item);
  });
}

function setEvidenceTable(id, evidence) {
  const table = document.getElementById(id);
  clearElement(table);
  evidence.forEach((item) => {
    const row = document.createElement("div");
    const label = document.createElement("strong");
    const value = document.createElement("span");
    const status = document.createElement("span");
    const impact = document.createElement("p");
    row.className = `evidence-row ${item.status}`;
    label.textContent = item.label;
    value.textContent = item.value;
    status.textContent = item.status;
    impact.textContent = item.impact;
    row.append(label, value, status, impact);
    table.appendChild(row);
  });
}

function dailyIntelligence(readinessResult) {
  if (!readinessResult || !readinessResult.state) {
    return ["Awaiting signal", "Daily State not submitted", "Complete Morning Roll Call", "Operating without current readiness"];
  }
  return [
    `${readinessResult.state} protocol`,
    readinessResult.headline,
    readinessResult.instruction,
    readinessResult.primaryRisk
  ];
}

function renderStatusBar(state) {
  setText("status-sleep", state ? valueOrDash(state.sleep, "h") : "—");
  setText("status-weight", state ? valueOrDash(state.weight) : "—");
  setText("status-steps", state ? valueOrDash(state.steps) : "—");
  setText("status-rhr", state ? valueOrDash(state.resting_heart_rate, " bpm") : "—");
  setText("status-confidence", state ? confidencePercent(state.confidence) : "—");
}

function renderCommandFeed(events) {
  const feed = document.getElementById("command-feed");
  clearElement(feed);

  if (!events.length) {
    const item = document.createElement("li");
    item.className = "feed-empty";
    item.textContent = "No command events yet. Submit Morning Roll Call to initialize today’s feed.";
    feed.appendChild(item);
    return;
  }

  events.forEach((event) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    const type = document.createElement("strong");
    const severity = document.createElement("span");
    const message = document.createElement("p");
    const time = document.createElement("time");

    item.className = `feed-event ${String(event.severity).toLowerCase()}`;
    meta.className = "feed-meta";
    type.textContent = String(event.event_type || "EVENT").replaceAll("_", " ");
    severity.textContent = event.severity || "INFO";
    message.textContent = event.message;
    time.dateTime = event.occurred_at;
    time.textContent = new Date(event.occurred_at).toLocaleString();

    meta.appendChild(type);
    meta.appendChild(severity);
    item.appendChild(meta);
    item.appendChild(message);
    item.appendChild(time);
    feed.appendChild(item);
  });
}

async function loadCommandFeed() {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("command_feed")
    .select("occurred_at,event_type,severity,message,metadata")
    .eq("user_id", session.user.id)
    .order("occurred_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  renderCommandFeed(data || []);
}

function renderWarRoom(state) {
  const required = document.getElementById("roll-call-required");
  const summary = document.getElementById("daily-state-summary");
  const formCard = document.getElementById("roll-call-card");
  const readiness = document.getElementById("readiness");

  if (!state) {
    required.hidden = false;
    summary.hidden = true;
    formCard.hidden = false;
    readiness.textContent = "—";
    readiness.className = "metric";
    setText("readiness-detail", "Submit Energy, Soreness, and Pain to calculate readiness.");
    setText("confidence", "0%");
    setText("confidence-detail", "Confidence: Energy 20%, Soreness 20%, Pain 20%, Sleep 15%, Resting heart rate 15%, Weight 5%, Steps 5%.");
    setText("mission", "Morning Roll Call Required.");
    setText("mission-detail", "No mission will be generated until today's state is saved.");
    setText("mission-restrictions", "Restrictions: Awaiting roll call.");
    setText("summary-comments", "—");
    setText("mission-status", "PENDING");
    document.getElementById("mission-status").className = "state-pill neutral";
    setText("mission-source", "No Daily State evidence.");
    setText("mission-confidence", "—");
    setText("mission-context", "Generated/current-state context unavailable.");
    setText("readiness-energy", "—");
    setText("readiness-soreness", "—");
    setText("readiness-pain", "—");
    renderStatusBar(null);
    const readinessResult = evaluateReadiness(null);
    const morningBrief = generateMorningBrief(readinessResult);
    setText("atlas-brief-state", morningBrief.commandState);
    document.getElementById("atlas-brief-state").className = "state-pill neutral";
    setText("atlas-brief-output", formatAtlasBriefVoice(morningBrief));
    setList("readiness-rationale", readinessResult.rationale, "Awaiting Daily State.");
    setEvidenceTable("readiness-evidence", readinessResult.evidence);
    setList("evidence-missing", readinessResult.missingEvidence, "None.");
    setList("readiness-restrictions", readinessResult.restrictions, "None.");
    setText("readiness-risk", readinessResult.primaryRisk);
    setText("readiness-instruction", readinessResult.instruction);
    const intel = dailyIntelligence(readinessResult);
    setText("daily-intel-title", intel[0]);
    setText("daily-primary", intel[1]);
    setText("daily-instruction", intel[2]);
    setText("daily-risk", intel[3]);
    return;
  }

  const readinessResult = evaluateReadiness(state);
  const derivedReadiness = readinessResult.state;
  const mission = generateMission(readinessResult);
  const morningBrief = generateMorningBrief(readinessResult);

  required.hidden = true;
  summary.hidden = false;
  formCard.hidden = true;
  readiness.textContent = derivedReadiness;
  readiness.className = `metric ${readinessClass[derivedReadiness]}`;
  setText("readiness-detail", readinessResult.headline);
  setText("confidence", confidencePercent(readinessResult.confidence));
  setText("confidence-detail", "Confidence: Energy 20%, Soreness 20%, Pain 20%, Sleep 15%, Resting heart rate 15%, Weight 5%, Steps 5%.");
  setText("mission", mission.title);
  setText("mission-detail", mission.detail);
  setText("mission-restrictions", mission.restrictions);
  setText("mission-status", derivedReadiness);
  document.getElementById("mission-status").className = `state-pill ${readinessClass[derivedReadiness]}`;
  setText("mission-source", `Daily State: Energy ${state.energy}/10, Soreness ${state.soreness}/10, Pain ${state.pain ? "Yes" : "No"}`);
  setText("mission-confidence", confidencePercent(readinessResult.confidence));
  setText("mission-context", `${readinessResult.headline} ${readinessResult.instruction}`);
  setText("atlas-brief-state", morningBrief.commandState);
  document.getElementById("atlas-brief-state").className = `state-pill ${readinessClass[derivedReadiness]}`;
  setText("atlas-brief-output", formatAtlasBriefVoice(morningBrief));
  setText("readiness-energy", `${state.energy}/10`);
  setText("readiness-soreness", `${state.soreness}/10`);
  setText("readiness-pain", state.pain ? "Yes" : "No");
  renderStatusBar({ ...state, confidence: readinessResult.confidence });
  setList("readiness-rationale", readinessResult.rationale, "None.");
  setEvidenceTable("readiness-evidence", readinessResult.evidence);
  setList("evidence-missing", readinessResult.missingEvidence, "None.");
  setList("readiness-restrictions", readinessResult.restrictions, "None.");
  setText("readiness-risk", readinessResult.primaryRisk);
  setText("readiness-instruction", readinessResult.instruction);
  const intel = dailyIntelligence(readinessResult);
  setText("daily-intel-title", intel[0]);
  setText("daily-primary", intel[1]);
  setText("daily-instruction", intel[2]);
  setText("daily-risk", intel[3]);

  setText("summary-date", state.date);
  setText("summary-energy", `${state.energy}/10`);
  setText("summary-soreness", `${state.soreness}/10`);
  setText("summary-pain", state.pain ? "Yes" : "No");
  setText("summary-confidence", confidencePercent(readinessResult.confidence));
  setText("summary-comments", state.comments || "—");
}

async function loadDailyState() {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("daily_state")
    .select(DAILY_STATE_COLUMNS)
    .eq("user_id", session.user.id)
    .eq("date", todayISODate())
    .maybeSingle();

  if (error) throw error;
  dailyState = data;
  renderWarRoom(dailyState);
}

function missionsMatch(previousMission, newMission) {
  return Boolean(previousMission)
    && previousMission.title === newMission.title
    && previousMission.detail === newMission.detail
    && previousMission.restrictions === newMission.restrictions
    && previousMission.generatedFromReadiness === newMission.generatedFromReadiness;
}

function buildCommandEvents(newState, previousState) {
  const newResult = evaluateReadiness(newState);
  const previousResult = previousState ? evaluateReadiness(previousState) : null;
  const newReadiness = newResult.state;
  const previousReadiness = previousResult ? previousResult.state : null;
  const newMission = generateMission(newResult);
  const previousMission = previousResult ? generateMission(previousResult) : null;
  const metadata = {
    date: newState.date,
    readiness: newReadiness,
    previousReadiness,
    missionTitle: newMission.title,
    previousMissionTitle: previousMission ? previousMission.title : null,
    confidence: newResult.confidence,
    rationaleSummary: newResult.rationale.join(" ")
  };
  const events = [
    {
      user_id: session.user.id,
      event_type: "ROLL_CALL_SUBMITTED",
      severity: "INFO",
      message: "Morning Roll Call submitted.",
      metadata
    }
  ];

  if (!previousReadiness || previousReadiness !== newReadiness) {
    events.push({
      user_id: session.user.id,
      event_type: "READINESS_UPDATED",
      severity: readinessSeverity[newReadiness],
      message: previousReadiness
        ? `Readiness changed: ${previousReadiness} → ${newReadiness}.`
        : `Readiness initialized: ${newReadiness}.`,
      metadata
    });
  }

  if (!missionsMatch(previousMission, newMission)) {
    events.push({
      user_id: session.user.id,
      event_type: "MISSION_GENERATED",
      severity: "INFO",
      message: previousMission
        ? `Mission changed: ${previousMission.title} → ${newMission.title}.`
        : `Mission initialized: ${newMission.title}.`,
      metadata: { ...metadata, restrictions: newMission.restrictions }
    });
  }

  return events;
}

async function writeCommandEvents(newState, previousState) {
  const supabase = await getClient();
  const { error } = await supabase
    .from("command_feed")
    .insert(buildCommandEvents(newState, previousState));

  if (error) throw error;
}

async function saveMorningRollCall(event) {
  event.preventDefault();
  const button = document.getElementById("save-roll-call");
  button.disabled = true;
  button.textContent = "Saving…";
  setStatus("");

  try {
    const form = new FormData(event.currentTarget);
    const comments = String(form.get("comments") || "").trim();
    const payload = {
      user_id: session.user.id,
      date: todayISODate(),
      energy: Number(form.get("energy")),
      soreness: Number(form.get("soreness")),
      pain: form.get("pain") === "yes",
      comments: comments || null
    };
    payload.confidence = evaluateReadiness(payload).confidence;

    const previousState = dailyState;
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_state")
      .upsert(payload, { onConflict: "user_id,date" })
      .select(DAILY_STATE_COLUMNS)
      .single();

    if (error) throw error;
    await writeCommandEvents(data, previousState);

    dailyState = data;
    renderWarRoom(dailyState);
    await loadCommandFeed();
    setStatus("Morning Roll Call saved.");
  } catch (error) {
    setStatus(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Submit Morning Roll Call";
  }
}

async function init() {
  try {
    setLoading(true);
    const supabase = await getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      window.location.replace("/");
      return;
    }
    session = data.session;
    setText("identity", "Signed in as " + session.user.email);
    await loadDailyState();
    await loadCommandFeed();
    await loadDailyCompliance();
  } catch (error) {
    setStatus(error.message);
  } finally {
    setLoading(false);
  }
}

if (typeof document !== "undefined") {
  initializeComplianceForm();
  document.getElementById("roll-call-form").addEventListener("submit", saveMorningRollCall);
  document.getElementById("compliance-form").addEventListener("submit", saveDailyCompliance);
  document.getElementById("compliance-form").addEventListener("input", () => renderComplianceScore(readComplianceForm()));
  document.getElementById("logout").addEventListener("click", async () => {
    const supabase = await getClient();
    await supabase.auth.signOut();
    window.location.replace("/");
  });

  init();
}

if (typeof module !== "undefined") {
  module.exports = { evaluateReadiness, calculateConfidence, calculateReadiness, generateMission, generateMorningBrief, formatAtlasBriefVoice, normalizeComplianceStatus, scoreComplianceDomain, calculateDisciplineScore, formatDisciplineScore, buildComplianceExplanation, deriveDailyComplianceState, dailyIntelligence, buildCommandEvents, __setSessionForTests: (value) => { session = value; } };
}

function emptyComplianceDomains() {
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, {
    status: null,
    target: "",
    actual: "",
    note: "",
    restriction: "",
    approvedModification: false
  }]));
}

function complianceDomainsFromRecord(record) {
  const domains = emptyComplianceDomains();
  if (!record) return domains;
  COMPLIANCE_DOMAINS.forEach((key) => {
    domains[key] = {
      status: normalizeComplianceStatus(record[`${key}_status`]),
      target: record[`${key}_target`] || "",
      actual: record[`${key}_actual`] || "",
      note: record[`${key}_note`] || "",
      restriction: record[`${key}_restriction`] || "",
      approvedModification: Boolean(record[`${key}_approved_modification`])
    };
  });
  return domains;
}

function complianceDomainRow(key) {
  return `
    <fieldset class="compliance-domain" data-domain="${key}">
      <legend>${COMPLIANCE_DOMAIN_LABELS[key]}</legend>
      <div class="compliance-domain-grid">
        <label>Assigned target
          <input name="${key}_target" maxlength="500" placeholder="What was assigned?">
        </label>
        <label>Completion status
          <select name="${key}_status">
            <option value="">NOT ASSESSED</option>
            <option value="completed">COMPLETE</option>
            <option value="partial">PARTIAL</option>
            <option value="missed">MISSED</option>
            <option value="excused">EXCUSED</option>
            <option value="not_applicable">N/A</option>
          </select>
        </label>
        <label>Actual result
          <input name="${key}_actual" maxlength="500" placeholder="What was completed or modified?">
        </label>
        <label>User note
          <input name="${key}_note" maxlength="500" placeholder="Optional execution context">
        </label>
        <label class="compliance-restriction">Restriction or approved modification
          <input name="${key}_restriction" maxlength="500" placeholder="Readiness, medical, or approved adjustment">
        </label>
        <label class="compliance-check"><input name="${key}_approved_modification" type="checkbox"> Approved modification</label>
      </div>
    </fieldset>`;
}

function initializeComplianceForm() {
  const container = document.getElementById("compliance-domains");
  container.innerHTML = COMPLIANCE_DOMAINS.map(complianceDomainRow).join("");
}

function applyMissionComplianceDefaults(domains) {
  if (!dailyState || domains.mission.target) return domains;
  const readinessResult = evaluateReadiness(dailyState);
  const mission = generateMission(readinessResult);
  domains.mission.target = `${mission.title}: ${mission.detail}`;
  domains.mission.restriction = readinessResult.restrictions.join("; ");
  domains.mission.approvedModification = readinessResult.state !== "GREEN";
  return domains;
}

function readComplianceForm() {
  const form = document.getElementById("compliance-form");
  const values = new FormData(form);
  return Object.fromEntries(COMPLIANCE_DOMAINS.map((key) => [key, {
    status: normalizeComplianceStatus(values.get(`${key}_status`)),
    target: String(values.get(`${key}_target`) || "").trim(),
    actual: String(values.get(`${key}_actual`) || "").trim(),
    note: String(values.get(`${key}_note`) || "").trim(),
    restriction: String(values.get(`${key}_restriction`) || "").trim(),
    approvedModification: values.get(`${key}_approved_modification`) === "on"
  }]));
}

function renderComplianceScore(domains) {
  const state = deriveDailyComplianceState(domains);
  setText("discipline-score", state.displayScore);
  setText("compliance-status", state.complianceStatus);
  setText("compliance-formula", state.explanation.formula);
  setList("compliance-included", state.explanation.included, "No domains included.");
  setList("compliance-excluded", state.explanation.excluded, "No domains excluded.");
}

function renderComplianceRecord(record, storageMode = "SUPABASE") {
  const domains = applyMissionComplianceDefaults(complianceDomainsFromRecord(record));
  COMPLIANCE_DOMAINS.forEach((key) => {
    const domain = domains[key];
    const form = document.getElementById("compliance-form");
    form.elements[`${key}_status`].value = domain.status || "";
    form.elements[`${key}_target`].value = domain.target;
    form.elements[`${key}_actual`].value = domain.actual;
    form.elements[`${key}_note`].value = domain.note;
    form.elements[`${key}_restriction`].value = domain.restriction;
    form.elements[`${key}_approved_modification`].checked = domain.approvedModification;
  });
  setText("compliance-date", record?.compliance_date || todayISODate());
  renderComplianceScore(domains);
  setText("compliance-storage", storageMode === "LOCAL" ? "LOCAL FALLBACK — Supabase record unavailable" : "SUPABASE RECORD");
  setText("compliance-updated", record?.updated_at ? `Last saved ${new Date(record.updated_at).toLocaleString()}` : "Not saved yet");
}

function complianceStorageKey() {
  return `coach-dominion:daily-compliance:${session?.user?.id || "local"}:${todayISODate()}`;
}

function loadLocalCompliance() {
  try {
    const stored = window.localStorage.getItem(complianceStorageKey());
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
}

function saveLocalCompliance(record) {
  try {
    window.localStorage.setItem(complianceStorageKey(), JSON.stringify(record));
    return true;
  } catch (_) {
    return false;
  }
}

async function loadDailyCompliance() {
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_compliance")
      .select(COMPLIANCE_COLUMNS)
      .eq("user_id", session.user.id)
      .eq("compliance_date", todayISODate())
      .maybeSingle();
    if (error) throw error;
    dailyCompliance = data;
    renderComplianceRecord(dailyCompliance, "SUPABASE");
  } catch (_) {
    dailyCompliance = loadLocalCompliance();
    renderComplianceRecord(dailyCompliance, "LOCAL");
  }
}

function compliancePayload(domains) {
  const state = deriveDailyComplianceState(domains);
  const payload = {
    user_id: session?.user?.id || null,
    compliance_date: todayISODate(),
    discipline_score: state.score,
    score_evidence: { evidence: state.evidence, explanation: state.explanation, complianceStatus: state.complianceStatus }
  };
  COMPLIANCE_DOMAINS.forEach((key) => {
    payload[`${key}_status`] = domains[key].status;
    payload[`${key}_target`] = domains[key].target || null;
    payload[`${key}_actual`] = domains[key].actual || null;
    payload[`${key}_note`] = domains[key].note || null;
    payload[`${key}_restriction`] = domains[key].restriction || null;
    payload[`${key}_approved_modification`] = domains[key].approvedModification;
  });
  return payload;
}

async function saveDailyCompliance(event) {
  event.preventDefault();
  const button = document.getElementById("save-compliance");
  button.disabled = true;
  button.textContent = "Saving…";
  const payload = compliancePayload(readComplianceForm());
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("daily_compliance")
      .upsert(payload, { onConflict: "user_id,compliance_date" })
      .select(COMPLIANCE_COLUMNS)
      .single();
    if (error) throw error;
    dailyCompliance = data;
    renderComplianceRecord(data, "SUPABASE");
  } catch (_) {
    const localRecord = { ...payload, updated_at: new Date().toISOString() };
    dailyCompliance = localRecord;
    const saved = saveLocalCompliance(localRecord);
    renderComplianceRecord(localRecord, "LOCAL");
    if (!saved) setText("compliance-storage", "UNSAVED — local storage unavailable");
  } finally {
    button.disabled = false;
    button.textContent = "Save Dominion Record";
  }
}
