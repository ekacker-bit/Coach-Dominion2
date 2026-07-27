
(function connectedDominionModule(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.ConnectedDominion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createConnectedDominion() {
  "use strict";

  const PROVIDER_CATALOG = Object.freeze([
    provider("STRAVA", "Strava", "ACTIVITY", ["RUN", "RIDE", "WALK", "SWIM"], ["READ_ACTIVITY"], "PLANNED", "PHASE_2", "Planned endurance activity import."),
    provider("GARMIN", "Garmin", "HEALTH", ["RUN", "RIDE", "SWIM", "STEPS", "HEART_RATE", "SLEEP", "BODYWEIGHT"], ["READ_ACTIVITY", "READ_HEALTH_METRICS", "READ_BODY_METRICS", "READ_SLEEP", "READ_HEART_RATE", "READ_STEPS"], "ARCHITECTURE_ONLY", "PHASE_2", "Architecture preview for activity and health metrics."),
    provider("APPLE_HEALTH", "Apple Health", "HEALTH", ["WALK", "STEPS", "HEART_RATE", "SLEEP", "BODYWEIGHT", "BODY_METRIC"], ["READ_HEALTH_METRICS", "READ_BODY_METRICS", "READ_SLEEP", "READ_HEART_RATE", "READ_STEPS"], "ARCHITECTURE_ONLY", "PHASE_3", "Architecture preview for user-authorized health data."),
    provider("FITBOD", "Fitbod", "STRENGTH", ["STRENGTH_SESSION", "EXERCISE_SET"], ["READ_STRENGTH_WORKOUTS"], "FILE_IMPORT", "PHASE_2", "User-controlled Fitbod workout-file import; no Fitbod credentials are stored."),
    provider("MYFITNESSPAL", "MyFitnessPal", "NUTRITION", ["CALORIES", "MACRONUTRIENTS", "BODYWEIGHT"], ["READ_NUTRITION", "READ_BODY_METRICS"], "PLANNED", "PHASE_4", "Planned nutrition and body-metric import.")
  ]);
  const PROVIDER_CODES = new Set(PROVIDER_CATALOG.map((item) => item.providerCode));
  const PERMISSIONS = Object.freeze(["READ_ACTIVITY", "READ_HEALTH_METRICS", "READ_STRENGTH_WORKOUTS", "READ_NUTRITION", "READ_BODY_METRICS", "READ_SLEEP", "READ_HEART_RATE", "READ_STEPS"]);
  const CONNECTION_STATUSES = Object.freeze(["NOT_CONNECTED", "CONNECTING", "CONNECTED", "REAUTH_REQUIRED", "SYNC_ERROR", "DISCONNECTED", "DISABLED"]);
  const SYNC_TYPES = Object.freeze(["INITIAL", "INCREMENTAL", "MANUAL", "RETRY"]);
  const SYNC_STATUSES = Object.freeze(["QUEUED", "RUNNING", "SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"]);
  const TERMINAL_SYNC_STATUSES = new Set(["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"]);
  const DATA_TYPES = Object.freeze(["RUN", "WALK", "RIDE", "SWIM", "STRENGTH_SESSION", "EXERCISE_SET", "CORE_SESSION", "CONDITIONING_SESSION", "BODYWEIGHT", "BODY_METRIC", "STEPS", "HEART_RATE", "SLEEP", "CALORIES", "MACRONUTRIENTS"]);
  const IMPORT_STATUSES = Object.freeze(["RECEIVED", "VALIDATED", "DUPLICATE", "REJECTED", "MAPPED", "UNMAPPED", "INVALIDATED"]);
  const VALIDATION_STATUSES = Object.freeze(["VALID", "INVALID", "PARTIAL", "UNSUPPORTED"]);
  const CONNECTION_TRANSITIONS = Object.freeze({
    NOT_CONNECTED: ["CONNECTING", "DISABLED"],
    CONNECTING: ["CONNECTED", "NOT_CONNECTED", "SYNC_ERROR"],
    CONNECTED: ["REAUTH_REQUIRED", "SYNC_ERROR", "DISCONNECTED"],
    REAUTH_REQUIRED: ["CONNECTING", "DISCONNECTED"],
    SYNC_ERROR: ["CONNECTED", "REAUTH_REQUIRED", "DISCONNECTED"],
    DISCONNECTED: [],
    DISABLED: []
  });
  const SYNC_TRANSITIONS = Object.freeze({
    QUEUED: ["RUNNING", "CANCELLED", "FAILED"],
    RUNNING: ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"],
    SUCCEEDED: [], PARTIAL: [], FAILED: [], CANCELLED: []
  });

  function provider(providerCode, displayName, category, supportedDataTypes, supportedPermissions, implementationStatus, implementationPhase, description) {
    return Object.freeze({ providerCode, provider_code: providerCode, displayName, display_name: displayName, category, connectionType: "ARCHITECTURE_PREVIEW", connection_type: "ARCHITECTURE_PREVIEW", supportedDataTypes: Object.freeze(supportedDataTypes), supported_data_types: Object.freeze(supportedDataTypes), supportedPermissions: Object.freeze(supportedPermissions), supported_permissions: Object.freeze(supportedPermissions), implementationStatus, implementation_status: implementationStatus, implementationPhase, implementation_phase: implementationPhase, description, architecturePreviewAvailable: true, architecture_preview_available: true });
  }
  function pick(input, camel, snake, fallback = null) {
    if (input && input[camel] !== undefined) return input[camel];
    if (input && input[snake] !== undefined) return input[snake];
    return fallback;
  }
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function text(value) { return String(value ?? "").trim(); }
  function upper(value) { return text(value).toUpperCase(); }
  function nowIso(options = {}) { return options.now || new Date().toISOString(); }
  function stableId(prefix, seed) {
    let hash = 2166136261;
    const source = String(seed);
    for (let i = 0; i < source.length; i += 1) { hash ^= source.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function stableUuid(seed) {
    const parts = [0, 1, 2, 3].map((salt) => stableId("x", `${salt}|${seed}`).slice(2));
    const hex = parts.join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
  function finite(value) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  function normalizeTimestamp(value) {
    const raw = text(value);
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? raw : date.toISOString();
  }
  function normalizeProviderCode(value) {
    const code = upper(value).replace(/[\s-]+/g, "_");
    return PROVIDER_CODES.has(code) ? code : null;
  }
  function getConnectedProviderCatalog() { return PROVIDER_CATALOG.map((item) => clone(item)); }
  function getProviderDefinition(value) {
    const code = normalizeProviderCode(value);
    const found = PROVIDER_CATALOG.find((item) => item.providerCode === code);
    return found ? clone(found) : null;
  }
  function normalizePermissionList(values = []) {
    return Array.from(new Set((Array.isArray(values) ? values : []).map(upper).filter((value) => PERMISSIONS.includes(value)))).sort();
  }
  function validatePermissionSelection(providerCode, permissions = []) {
    const definition = getProviderDefinition(providerCode);
    const requested = Array.isArray(permissions) ? permissions.map(upper) : [];
    const unknown = requested.filter((value) => !PERMISSIONS.includes(value));
    const unsupported = requested.filter((value) => PERMISSIONS.includes(value) && !definition?.supportedPermissions.includes(value));
    return { valid: Boolean(definition) && unknown.length === 0 && unsupported.length === 0, permissions: normalizePermissionList(requested), unknown, unsupported };
  }
  function normalizeConnectedAccount(input = {}, options = {}) {
    const providerCode = normalizeProviderCode(pick(input, "providerCode", "provider_code"));
    const definition = getProviderDefinition(providerCode);
    const createdAt = pick(input, "createdAt", "created_at", nowIso(options));
    const connectionStatus = upper(pick(input, "connectionStatus", "connection_status", "NOT_CONNECTED"));
    const permissions = normalizePermissionList(pick(input, "permissions", "permissions", []));
    return {
      id: text(pick(input, "id", "id")) || stableId("acct", `${pick(input, "userId", "user_id", "local")}|${providerCode}|${createdAt}`),
      userId: text(pick(input, "userId", "user_id", options.userId || "local")),
      providerCode,
      providerDisplayName: text(pick(input, "providerDisplayName", "provider_display_name", definition?.displayName || "")),
      connectionStatus: CONNECTION_STATUSES.includes(connectionStatus) ? connectionStatus : "NOT_CONNECTED",
      permissions,
      externalAccountId: text(pick(input, "externalAccountId", "external_account_id")) || null,
      externalAccountLabel: text(pick(input, "externalAccountLabel", "external_account_label")) || null,
      lastSuccessfulSyncAt: pick(input, "lastSuccessfulSyncAt", "last_successful_sync_at"),
      lastAttemptedSyncAt: pick(input, "lastAttemptedSyncAt", "last_attempted_sync_at"),
      lastSyncStatus: upper(pick(input, "lastSyncStatus", "last_sync_status")) || null,
      lastSyncErrorCode: text(pick(input, "lastSyncErrorCode", "last_sync_error_code")) || null,
      lastSyncErrorMessage: text(pick(input, "lastSyncErrorMessage", "last_sync_error_message")) || null,
      syncCursor: text(pick(input, "syncCursor", "sync_cursor")) || null,
      metadata: clone(pick(input, "metadata", "metadata", {})) || {},
      isSimulated: Boolean(pick(input, "isSimulated", "is_simulated", false)),
      createdAt,
      updatedAt: pick(input, "updatedAt", "updated_at", createdAt),
      disconnectedAt: pick(input, "disconnectedAt", "disconnected_at")
    };
  }
  function validateConnectedAccount(input = {}) {
    const account = normalizeConnectedAccount(input);
    const permissionCheck = validatePermissionSelection(account.providerCode, pick(input, "permissions", "permissions", []));
    const errors = [];
    if (!account.providerCode) errors.push("Unsupported provider code.");
    if (!CONNECTION_STATUSES.includes(account.connectionStatus)) errors.push("Invalid connection status.");
    if (!permissionCheck.valid) errors.push("Permission selection is unsupported.");
    if (account.connectionStatus === "CONNECTED" && !account.isSimulated) errors.push("Live provider connections are not available.");
    return { valid: errors.length === 0, errors, account };
  }
  function validateConnectionTransition(from, to) {
    const source = upper(from), target = upper(to);
    return Boolean(CONNECTION_TRANSITIONS[source]?.includes(target));
  }
  function transitionConnectedAccount(input, targetStatus, options = {}) {
    const account = normalizeConnectedAccount(input, options);
    const target = upper(targetStatus);
    if (!validateConnectionTransition(account.connectionStatus, target)) return { valid: false, account, error: "Invalid connection transition." };
    return { valid: true, account: { ...account, connectionStatus: target, updatedAt: nowIso(options), disconnectedAt: target === "DISCONNECTED" ? nowIso(options) : account.disconnectedAt } };
  }
  function normalizeSyncJob(input = {}, options = {}) {
    const createdAt = pick(input, "createdAt", "created_at", nowIso(options));
    const syncType = upper(pick(input, "syncType", "sync_type", "MANUAL"));
    const status = upper(pick(input, "status", "status", "QUEUED"));
    return {
      id: text(pick(input, "id", "id")) || stableId("sync", `${pick(input, "connectedAccountId", "connected_account_id")}|${createdAt}|${syncType}`),
      userId: text(pick(input, "userId", "user_id", options.userId || "local")),
      connectedAccountId: text(pick(input, "connectedAccountId", "connected_account_id")),
      providerCode: normalizeProviderCode(pick(input, "providerCode", "provider_code")),
      syncType: SYNC_TYPES.includes(syncType) ? syncType : "MANUAL",
      status: SYNC_STATUSES.includes(status) ? status : "QUEUED",
      requestedAt: pick(input, "requestedAt", "requested_at", createdAt),
      startedAt: pick(input, "startedAt", "started_at"),
      completedAt: pick(input, "completedAt", "completed_at"),
      cursorBefore: text(pick(input, "cursorBefore", "cursor_before")) || null,
      cursorAfter: text(pick(input, "cursorAfter", "cursor_after")) || null,
      importedCount: Math.max(0, finite(pick(input, "importedCount", "imported_count", 0)) || 0),
      duplicateCount: Math.max(0, finite(pick(input, "duplicateCount", "duplicate_count", 0)) || 0),
      rejectedCount: Math.max(0, finite(pick(input, "rejectedCount", "rejected_count", 0)) || 0),
      unmappedCount: Math.max(0, finite(pick(input, "unmappedCount", "unmapped_count", 0)) || 0),
      errorCode: text(pick(input, "errorCode", "error_code")) || null,
      errorMessage: text(pick(input, "errorMessage", "error_message")) || null,
      summary: clone(pick(input, "summary", "summary", {})) || {},
      isDemo: Boolean(pick(input, "isDemo", "is_demo", false)),
      createdAt
    };
  }
  function validateSyncTransition(from, to) { return Boolean(SYNC_TRANSITIONS[upper(from)]?.includes(upper(to))); }
  function transitionSyncJob(input, targetStatus, options = {}) {
    const job = normalizeSyncJob(input, options), target = upper(targetStatus);
    if (!validateSyncTransition(job.status, target)) return { valid: false, job, error: "Invalid sync transition." };
    return { valid: true, job: { ...job, status: target, startedAt: target === "RUNNING" ? nowIso(options) : job.startedAt, completedAt: TERMINAL_SYNC_STATUSES.has(target) ? nowIso(options) : job.completedAt } };
  }
  function createRetrySyncJob(input = {}, options = {}) {
    const original = normalizeSyncJob(input, options);
    const createdAt = nowIso(options);
    return normalizeSyncJob({ userId: original.userId, connectedAccountId: original.connectedAccountId, providerCode: original.providerCode, syncType: "RETRY", status: "QUEUED", requestedAt: createdAt, createdAt, isDemo: original.isDemo, summary: { retryOf: original.id } }, options);
  }
  function normalizeImportedPayload(payload = {}) {
    const copy = clone(payload) || {};
    const result = {};
    Object.keys(copy).sort().forEach((key) => { result[key] = copy[key]; });
    return result;
  }
  function classifyImportedDataType(input = {}) {
    const candidate = upper(pick(input, "dataType", "data_type", pick(input, "providerRecordType", "provider_record_type")));
    return DATA_TYPES.includes(candidate) ? candidate : null;
  }
  function buildImportedRecordDeduplicationKey(input = {}) {
    const userId = text(pick(input, "userId", "user_id", "local"));
    const providerCode = normalizeProviderCode(pick(input, "providerCode", "provider_code")) || "UNKNOWN";
    const recordId = text(pick(input, "providerRecordId", "provider_record_id"));
    const recordType = upper(pick(input, "providerRecordType", "provider_record_type", "RECORD"));
    if (recordId) return `provider|${userId}|${providerCode}|${recordType}|${recordId}`;
    const payload = normalizeImportedPayload(pick(input, "normalizedPayload", "normalized_payload", input));
    const occurredAt = normalizeTimestamp(pick(input, "occurredAt", "occurred_at", payload.occurredAt || payload.occurred_at));
    const dataType = classifyImportedDataType(input) || "UNKNOWN";
    const duration = finite(payload.durationSeconds ?? payload.duration_seconds ?? payload.duration);
    const distance = finite(payload.distance);
    const load = finite(payload.load ?? payload.weight);
    const signature = [providerCode, dataType, occurredAt, upper(payload.activityType ?? payload.activity_type ?? payload.exerciseCode ?? payload.exercise_code), duration, distance, load].join("|");
    return `fallback|${userId}|${signature}`;
  }
  function normalizeImportedRecord(input = {}, options = {}) {
    const createdAt = pick(input, "createdAt", "created_at", nowIso(options));
    const normalizedPayload = normalizeImportedPayload(pick(input, "normalizedPayload", "normalized_payload", {}));
    const dataType = classifyImportedDataType({ ...input, normalizedPayload });
    const record = {
      id: text(pick(input, "id", "id")) || stableId("import", `${pick(input, "sourceSyncJobId", "source_sync_job_id")}|${buildImportedRecordDeduplicationKey(input)}`),
      userId: text(pick(input, "userId", "user_id", options.userId || "local")),
      connectedAccountId: text(pick(input, "connectedAccountId", "connected_account_id")),
      providerCode: normalizeProviderCode(pick(input, "providerCode", "provider_code")),
      providerRecordId: text(pick(input, "providerRecordId", "provider_record_id")) || null,
      providerRecordType: upper(pick(input, "providerRecordType", "provider_record_type", dataType || "UNKNOWN")),
      sourceCreatedAt: pick(input, "sourceCreatedAt", "source_created_at"),
      sourceUpdatedAt: pick(input, "sourceUpdatedAt", "source_updated_at"),
      occurredAt: normalizeTimestamp(pick(input, "occurredAt", "occurred_at", normalizedPayload.occurredAt || normalizedPayload.occurred_at)),
      timezone: text(pick(input, "timezone", "timezone", normalizedPayload.timezone || "UTC")) || "UTC",
      dataType,
      normalizedPayload,
      rawPayload: clone(pick(input, "rawPayload", "raw_payload", {})) || {},
      deduplicationKey: text(pick(input, "deduplicationKey", "deduplication_key")) || "",
      validationStatus: upper(pick(input, "validationStatus", "validation_status", dataType ? "VALID" : "UNSUPPORTED")),
      importStatus: upper(pick(input, "importStatus", "import_status", "RECEIVED")),
      rejectionReason: text(pick(input, "rejectionReason", "rejection_reason")) || null,
      mappedPerformanceEntryId: text(pick(input, "mappedPerformanceEntryId", "mapped_performance_entry_id")) || null,
      sourceSyncJobId: text(pick(input, "sourceSyncJobId", "source_sync_job_id")),
      isDemo: Boolean(pick(input, "isDemo", "is_demo", false)),
      createdAt,
      updatedAt: pick(input, "updatedAt", "updated_at", createdAt)
    };
    record.deduplicationKey ||= buildImportedRecordDeduplicationKey(record);
    if (!VALIDATION_STATUSES.includes(record.validationStatus)) record.validationStatus = "INVALID";
    if (!IMPORT_STATUSES.includes(record.importStatus)) record.importStatus = "RECEIVED";
    return record;
  }
  function validateImportedRecord(input = {}) {
    const record = normalizeImportedRecord(input);
    const errors = [];
    if (!record.providerCode) errors.push("Unsupported provider.");
    if (!record.dataType) errors.push("Unsupported data type.");
    if (!record.occurredAt) errors.push("Occurred time is required.");
    const numericKeys = ["distance", "duration", "durationSeconds", "duration_seconds", "load", "weight", "sets", "repetitions", "value", "measurement_value"];
    numericKeys.forEach((key) => {
      if (record.normalizedPayload[key] !== undefined && Number.isNaN(finite(record.normalizedPayload[key]))) errors.push(`Invalid numeric value: ${key}.`);
    });
    return { valid: errors.length === 0, errors, record: { ...record, validationStatus: errors.length ? (record.dataType ? "INVALID" : "UNSUPPORTED") : "VALID", importStatus: errors.length ? "REJECTED" : record.importStatus, rejectionReason: errors.join(" ") || record.rejectionReason } };
  }
  function reconcileImportedRecord(input, existingRecords = []) {
    const checked = validateImportedRecord(input);
    if (!checked.valid) return checked.record;
    const duplicate = (existingRecords || []).map(normalizeImportedRecord).find((item) => item.deduplicationKey === checked.record.deduplicationKey);
    return duplicate ? { ...checked.record, importStatus: "DUPLICATE", mappedPerformanceEntryId: duplicate.mappedPerformanceEntryId, rejectionReason: `Duplicate of ${duplicate.id}` } : { ...checked.record, importStatus: "VALIDATED" };
  }
  function buildImportProvenance(record = {}) {
    const item = normalizeImportedRecord(record);
    return { sourceType: "PROVIDER_IMPORT", sourceProvider: item.providerCode, sourceAccountId: item.connectedAccountId, sourceRecordId: item.providerRecordId, sourceImportId: item.id, sourceSyncJobId: item.sourceSyncJobId, sourceUpdatedAt: item.sourceUpdatedAt, importMethod: item.isDemo ? "DEMO_SYNC" : "PROVIDER_SYNC", sourceEvidenceStatus: "SELF REPORTED", sourceIsDemo: item.isDemo };
  }
  function requiredPermission(dataType) {
    if (["RUN", "WALK", "RIDE", "SWIM", "CONDITIONING_SESSION", "CORE_SESSION"].includes(dataType)) return "READ_ACTIVITY";
    if (["STRENGTH_SESSION", "EXERCISE_SET"].includes(dataType)) return "READ_STRENGTH_WORKOUTS";
    if (["BODYWEIGHT", "BODY_METRIC"].includes(dataType)) return "READ_BODY_METRICS";
    if (["CALORIES", "MACRONUTRIENTS"].includes(dataType)) return "READ_NUTRITION";
    if (dataType === "SLEEP") return "READ_SLEEP";
    if (dataType === "HEART_RATE") return "READ_HEART_RATE";
    if (dataType === "STEPS") return "READ_STEPS";
    return null;
  }
  function mapImportedRecordToPerformanceEntry(input, options = {}) {
    const checked = validateImportedRecord(input), record = checked.record;
    if (!checked.valid) return { status: "REJECTED", record, entry: null, reason: checked.errors.join(" ") };
    const permission = requiredPermission(record.dataType);
    const permissions = normalizePermissionList(options.permissions || []);
    if (permission && !permissions.includes(permission)) return { status: "UNMAPPED", record: { ...record, importStatus: "UNMAPPED" }, entry: null, reason: `Permission ${permission} is required.` };
    const p = record.normalizedPayload;
    const base = { id: record.mappedPerformanceEntryId || stableUuid(record.deduplicationKey), performanceDate: text(record.occurredAt).slice(0, 10), performanceTime: text(record.occurredAt).includes("T") ? text(record.occurredAt).slice(11, 19) : null, source: "IMPORTED", evidenceStatus: "SELF REPORTED", notes: record.isDemo ? "DEMO provider import." : "Provider import.", provenance: buildImportProvenance(record) };
    let entry = null;
    if (record.dataType === "RUN") {
      const distance = finite(p.distance), duration = finite(p.durationSeconds ?? p.duration_seconds ?? p.duration);
      if (!(distance > 0 && duration > 0)) return unmapped(record, "Run requires positive distance and duration.");
      entry = { ...base, domain: "running", entryType: "WORKOUT_SUMMARY", activityCode: text(p.activityCode ?? p.activity_code) || "custom", activityName: text(p.activityName ?? p.activity_name) || "Imported run", metrics: { distance, distance_unit: text(p.distanceUnit ?? p.distance_unit) || "mi", duration_seconds: duration } };
    } else if (["STRENGTH_SESSION", "EXERCISE_SET"].includes(record.dataType)) {
      const code = text(p.exerciseCode ?? p.exercise_code), name = text(p.exerciseName ?? p.exercise_name), sets = finite(p.sets), repetitions = finite(p.repetitions), load = finite(p.load ?? p.weight);
      if (!code || !name || !(sets > 0) || !(repetitions > 0) || load === null || load < 0) return unmapped(record, "Strength import requires exact exercise identity, sets, repetitions, and load.");
      entry = { ...base, domain: "strength", entryType: "TRAINING_SET", activityCode: code, activityName: name, metrics: { sets, repetitions, weight: load, weight_unit: text(p.loadUnit ?? p.load_unit ?? p.weightUnit ?? p.weight_unit) || "lb" } };
    } else if (record.dataType === "BODYWEIGHT") {
      const value = finite(p.value ?? p.measurementValue ?? p.measurement_value);
      if (!(value > 0)) return unmapped(record, "Bodyweight requires a positive value.");
      entry = { ...base, domain: "body_metrics", entryType: "MEASUREMENT", activityCode: "bodyweight", activityName: "Bodyweight", metrics: { measurement_value: value, measurement_unit: text(p.unit ?? p.measurementUnit ?? p.measurement_unit) || "lb", measurement_location: "bodyweight" } };
    } else if (record.dataType === "CONDITIONING_SESSION") {
      const code = text(p.activityCode ?? p.activity_code), duration = finite(p.durationSeconds ?? p.duration_seconds), repetitions = finite(p.repetitions), distance = finite(p.distance), calories = finite(p.calories);
      if (!code || !(duration > 0) || !([repetitions, distance, calories].some((value) => value > 0))) return unmapped(record, "Conditioning import requires an exact protocol and measurable result.");
      entry = { ...base, domain: "conditioning", entryType: "BENCHMARK", activityCode: code, activityName: text(p.activityName ?? p.activity_name) || code, metrics: { duration_seconds: duration, repetitions, distance, distance_unit: text(p.distanceUnit ?? p.distance_unit), calories } };
    } else return unmapped(record, "This imported data type is retained but does not map to Performance.");
    const normalized = typeof options.normalizePerformanceEntry === "function" ? options.normalizePerformanceEntry(entry) : entry;
    const validation = typeof options.validatePerformanceEntry === "function" ? options.validatePerformanceEntry(normalized) : { valid: true };
    if (validation && validation.valid === false) return unmapped(record, "Existing Performance validation rejected the mapped entry.");
    normalized.provenance = clone(entry.provenance);
    return { status: "MAPPED", record: { ...record, importStatus: "MAPPED", mappedPerformanceEntryId: normalized.id }, entry: normalized, reason: null };
  }
  function unmapped(record, reason) { return { status: "UNMAPPED", record: { ...record, importStatus: "UNMAPPED" }, entry: null, reason }; }
  function summarizeSyncJob(records = []) {
    const items = (records || []).map(normalizeImportedRecord);
    return { imported: items.filter((item) => item.importStatus === "MAPPED").length, duplicate: items.filter((item) => item.importStatus === "DUPLICATE").length, rejected: items.filter((item) => item.importStatus === "REJECTED").length, unmapped: items.filter((item) => item.importStatus === "UNMAPPED").length, total: items.length };
  }
  function deriveConnectedViewState(input = {}) {
    if (input.loading) return "LOADING";
    if (input.authRequired) return "AUTHENTICATION_REQUIRED";
    if (input.remoteLoadFailed && input.localFallback) return "LOCAL_FALLBACK_ACTIVE";
    if (input.remoteLoadFailed) return "REMOTE_LOAD_FAILED";
    if (!(input.accounts || []).length) return "NO_CONNECTED_ACCOUNTS";
    return "READY";
  }
  function buildConnectedOverviewModel(input = {}) {
    const accounts = (input.accounts || []).map(normalizeConnectedAccount);
    const jobs = (input.jobs || []).map(normalizeSyncJob).sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)));
    const records = (input.records || []).map(normalizeImportedRecord);
    const summary = summarizeSyncJob(records);
    return { providerCount: PROVIDER_CATALOG.length, simulatedAccountCount: accounts.filter((item) => item.isSimulated && item.connectionStatus === "CONNECTED").length, mostRecentSyncStatus: jobs[0]?.status || "NO SYNCS", importedRecordCount: records.length, duplicateCount: summary.duplicate, rejectedCount: summary.rejected, unmappedCount: summary.unmapped, storageState: input.storageState || "LOCAL" };
  }
  function storageKey(kind, userId = "local") { return `coach-dominion:${kind}:${userId || "local"}`; }
  function sortByDate(items, key) { return [...items].sort((a, b) => String(b[key] || "").localeCompare(String(a[key] || "")) || String(a.id).localeCompare(String(b.id))); }
  function createDemoRecords(account, job, options = {}) {
    const occurredAt = options.occurredAt || "2026-01-15T07:00:00-06:00";
    const fixtures = {
      STRAVA: [{ dataType: "RUN", providerRecordId: "demo-run-001", providerRecordType: "ACTIVITY", occurredAt, timezone: "America/Chicago", normalizedPayload: { distance: 3.1, distance_unit: "mi", duration_seconds: 1560, activity_code: "easy_run", activity_name: "Demo 5K run" } }],
      GARMIN: [{ dataType: "RUN", providerRecordId: "demo-run-001", providerRecordType: "ACTIVITY", occurredAt, timezone: "America/Chicago", normalizedPayload: { distance: 5, distance_unit: "km", duration_seconds: 1500, activity_code: "tempo", activity_name: "Demo Garmin run" } }, { dataType: "HEART_RATE", providerRecordId: "demo-hr-001", providerRecordType: "HEALTH", occurredAt, normalizedPayload: { value: 58, unit: "bpm" } }],
      APPLE_HEALTH: [{ dataType: "BODYWEIGHT", providerRecordId: "demo-weight-001", providerRecordType: "BODY_METRIC", occurredAt: occurredAt.slice(0, 10), timezone: "America/Chicago", normalizedPayload: { value: 180, unit: "lb" } }],
      FITBOD: [{ dataType: "EXERCISE_SET", providerRecordId: "demo-set-001", providerRecordType: "STRENGTH", occurredAt, normalizedPayload: { exercise_code: "bench_press", exercise_name: "Bench Press", sets: 3, repetitions: 5, load: 185, load_unit: "lb" } }],
      MYFITNESSPAL: [{ dataType: "CALORIES", providerRecordId: "demo-calories-001", providerRecordType: "NUTRITION", occurredAt: occurredAt.slice(0, 10), normalizedPayload: { calories: 2400 } }]
    };
    return (fixtures[account.providerCode] || []).map((item) => normalizeImportedRecord({ ...item, userId: account.userId, connectedAccountId: account.id, providerCode: account.providerCode, sourceSyncJobId: job.id, rawPayload: clone(item.normalizedPayload), isDemo: true }, options));
  }
  function parseCsvRows(source) {
    const rows = []; let row = [], value = "", quoted = false;
    const input = String(source || "").replace(/^\uFEFF/, "");
    for (let index = 0; index < input.length; index += 1) {
      const character = input[index];
      if (character === '"') {
        if (quoted && input[index + 1] === '"') { value += '"'; index += 1; }
        else quoted = !quoted;
      } else if (character === "," && !quoted) { row.push(value); value = ""; }
      else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && input[index + 1] === "\n") index += 1;
        row.push(value); value = "";
        if (row.some((cell) => text(cell))) rows.push(row);
        row = [];
      } else value += character;
    }
    row.push(value);
    if (row.some((cell) => text(cell))) rows.push(row);
    return rows;
  }
  function fitbodHeader(value) { return text(value).toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
  function parseFitbodWorkoutCsv(source, options = {}) {
    const rows = parseCsvRows(source);
    if (rows.length < 2) return { records: [], errors: ["The Fitbod file has no workout rows."] };
    const headers = rows[0].map(fitbodHeader);
    const aliases = {
      occurredAt: ["date", "datetime", "workout_date", "logged_at", "timestamp"],
      exercise: ["exercise", "exercise_name", "movement", "name"],
      repetitions: ["reps", "repetitions", "rep_count"],
      load: ["weight", "load", "weight_lbs", "weight_kg"],
      unit: ["unit", "weight_unit", "load_unit"],
      setNumber: ["set", "set_number", "set_index"],
      duration: ["duration", "duration_seconds", "seconds"],
      workout: ["workout", "workout_name", "session"]
    };
    const column = (names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
    const indexes = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, column(names)]));
    if (indexes.occurredAt < 0 || indexes.exercise < 0) return { records: [], errors: ["Fitbod import requires Date and Exercise columns."] };
    const errors = [], records = [];
    rows.slice(1).forEach((cells, rowIndex) => {
      const get = (key) => indexes[key] >= 0 ? text(cells[indexes[key]]) : "";
      const occurredAt = normalizeTimestamp(get("occurredAt")), exerciseName = get("exercise");
      if (!occurredAt || !exerciseName) { errors.push(`Row ${rowIndex + 2}: missing Date or Exercise.`); return; }
      const repetitions = finite(get("repetitions")), load = finite(get("load")), durationSeconds = finite(get("duration"));
      if ([repetitions, load, durationSeconds].some(Number.isNaN)) { errors.push(`Row ${rowIndex + 2}: invalid numeric value.`); return; }
      const rawPayload = Object.fromEntries(headers.map((header, index) => [header || `column_${index + 1}`, text(cells[index])]));
      const seed = `${occurredAt}|${exerciseName}|${get("setNumber")}|${get("repetitions")}|${get("load")}|${rowIndex}`;
      records.push(normalizeImportedRecord({
        id: stableId("fitbod_record", seed), userId: options.userId, connectedAccountId: options.connectedAccountId,
        providerCode: "FITBOD", providerRecordId: stableId("fitbod", seed), providerRecordType: "STRENGTH",
        dataType: "EXERCISE_SET", occurredAt, timezone: get("timezone") || options.timezone || "UTC",
        normalizedPayload: { exercise_code: fitbodHeader(exerciseName), exercise_name: exerciseName, sets: 1,
          repetitions, load, load_unit: get("unit") || (headers[indexes.load] === "weight_kg" ? "kg" : "lb"),
          set_number: finite(get("setNumber")), duration_seconds: durationSeconds, workout_name: get("workout") },
        rawPayload, sourceSyncJobId: options.sourceSyncJobId, isDemo: false
      }, options));
    });
    return { records, errors };
  }

  return Object.freeze({
    PERMISSIONS, CONNECTION_STATUSES, SYNC_TYPES, SYNC_STATUSES, DATA_TYPES, IMPORT_STATUSES, VALIDATION_STATUSES,
    normalizeProviderCode, getConnectedProviderCatalog, getProviderDefinition, normalizePermissionList, validatePermissionSelection,
    normalizeConnectedAccount, validateConnectedAccount, validateConnectionTransition, transitionConnectedAccount,
    normalizeSyncJob, validateSyncTransition, transitionSyncJob, createRetrySyncJob,
    normalizeImportedPayload, classifyImportedDataType, normalizeImportedRecord, validateImportedRecord,
    buildImportedRecordDeduplicationKey, reconcileImportedRecord, buildImportProvenance, mapImportedRecordToPerformanceEntry,
    summarizeSyncJob, deriveConnectedViewState, buildConnectedOverviewModel, storageKey, sortByDate, createDemoRecords,
    parseFitbodWorkoutCsv, stableId, stableUuid, clone
  });
});

