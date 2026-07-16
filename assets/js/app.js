let client;
let session;
let dailyState;

const DAILY_STATE_COLUMNS = "date,energy,soreness,pain,sleep,weight,steps,resting_heart_rate,confidence,comments";

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

function calculateReadiness(state) {
  if (state.pain) return "RED";
  if (state.energy >= 7 && state.soreness <= 4) return "GREEN";
  return "YELLOW";
}

function calculateConfidence(state) {
  let confidence = 0;
  if (state.energy && state.soreness && typeof state.pain === "boolean") confidence += 0.55;
  if (state.sleep !== null && state.sleep !== undefined) confidence += 0.15;
  if (state.weight !== null && state.weight !== undefined) confidence += 0.10;
  if (state.resting_heart_rate !== null && state.resting_heart_rate !== undefined) confidence += 0.15;
  if (state.steps !== null && state.steps !== undefined) confidence += 0.05;
  return Math.min(1, Number(confidence.toFixed(2)));
}

function generateMission(readiness) {
  if (readiness === "RED") {
    return {
      title: "Recovery mission",
      detail: "Remove hard training and protect recovery",
      restrictions: "No hard training, no testing pain",
      generatedFromReadiness: readiness
    };
  }

  if (readiness === "YELLOW") {
    return {
      title: "Reduced mission",
      detail: "Complete primary work only and remove optional intensity",
      restrictions: "No extra volume",
      generatedFromReadiness: readiness
    };
  }

  return {
    title: "Execute prescribed session",
    detail: "Proceed exactly as written",
    restrictions: "No unauthorized volume",
    generatedFromReadiness: readiness
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

function evidenceForState(state) {
  if (!state) return { available: [], missing: ["Daily State required."] };
  const checks = [
    ["Energy", state.energy],
    ["Soreness", state.soreness],
    ["Pain status", typeof state.pain === "boolean" ? state.pain : null],
    ["Sleep", state.sleep],
    ["Weight", state.weight],
    ["Steps", state.steps],
    ["Resting heart rate", state.resting_heart_rate]
  ];
  return {
    available: checks.filter(([, value]) => value !== null && value !== undefined).map(([label]) => label),
    missing: checks.filter(([, value]) => value === null || value === undefined).map(([label]) => label)
  };
}

function dailyIntelligence(readiness) {
  if (readiness === "GREEN") {
    return ["GREEN protocol", "Recovery capacity acceptable", "Execute prescribed mission", "Unauthorized additional volume"];
  }
  if (readiness === "YELLOW") {
    return ["YELLOW protocol", "Reduced readiness", "Complete primary work only", "Excess intensity or volume"];
  }
  if (readiness === "RED") {
    return ["RED protocol", "Pain reported", "Recovery mission", "Hard training"];
  }
  return ["Awaiting signal", "Daily State not submitted", "Complete Morning Roll Call", "Operating without current readiness"];
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
    setText("confidence-detail", "No Daily State evidence available yet.");
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
    setList("evidence-available", [], "None yet.");
    setList("evidence-missing", ["Daily State required."], "None.");
    const intel = dailyIntelligence(null);
    setText("daily-intel-title", intel[0]);
    setText("daily-primary", intel[1]);
    setText("daily-instruction", intel[2]);
    setText("daily-risk", intel[3]);
    return;
  }

  const derivedReadiness = calculateReadiness(state);
  const mission = generateMission(derivedReadiness);

  required.hidden = true;
  summary.hidden = false;
  formCard.hidden = true;
  readiness.textContent = derivedReadiness;
  readiness.className = `metric ${readinessClass[derivedReadiness]}`;
  setText("readiness-detail", `Energy ${state.energy}/10 · Soreness ${state.soreness}/10 · Pain ${state.pain ? "Yes" : "No"}`);
  setText("confidence", confidencePercent(state.confidence));
  setText("confidence-detail", "Based on available Daily State evidence.");
  setText("mission", mission.title);
  setText("mission-detail", mission.detail);
  setText("mission-restrictions", mission.restrictions);
  setText("mission-status", derivedReadiness);
  document.getElementById("mission-status").className = `state-pill ${readinessClass[derivedReadiness]}`;
  setText("mission-source", `Daily State: Energy ${state.energy}/10, Soreness ${state.soreness}/10, Pain ${state.pain ? "Yes" : "No"}`);
  setText("mission-confidence", confidencePercent(state.confidence));
  setText("mission-context", `Current state ${derivedReadiness}; mission generated from existing readiness calculation.`);
  setText("readiness-energy", `${state.energy}/10`);
  setText("readiness-soreness", `${state.soreness}/10`);
  setText("readiness-pain", state.pain ? "Yes" : "No");
  renderStatusBar(state);
  const evidence = evidenceForState(state);
  setList("evidence-available", evidence.available, "None yet.");
  setList("evidence-missing", evidence.missing, "None.");
  const intel = dailyIntelligence(derivedReadiness);
  setText("daily-intel-title", intel[0]);
  setText("daily-primary", intel[1]);
  setText("daily-instruction", intel[2]);
  setText("daily-risk", intel[3]);

  setText("summary-date", state.date);
  setText("summary-energy", `${state.energy}/10`);
  setText("summary-soreness", `${state.soreness}/10`);
  setText("summary-pain", state.pain ? "Yes" : "No");
  setText("summary-confidence", confidencePercent(state.confidence));
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
  const newReadiness = calculateReadiness(newState);
  const previousReadiness = previousState ? calculateReadiness(previousState) : null;
  const newMission = generateMission(newReadiness);
  const previousMission = previousReadiness ? generateMission(previousReadiness) : null;
  const metadata = {
    date: newState.date,
    readiness: newReadiness,
    previousReadiness,
    missionTitle: newMission.title,
    previousMissionTitle: previousMission ? previousMission.title : null,
    confidence: newState.confidence
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
    payload.confidence = calculateConfidence(payload);

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
  } catch (error) {
    setStatus(error.message);
  } finally {
    setLoading(false);
  }
}

document.getElementById("roll-call-form").addEventListener("submit", saveMorningRollCall);
document.getElementById("logout").addEventListener("click", async () => {
  const supabase = await getClient();
  await supabase.auth.signOut();
  window.location.replace("/");
});

init();
