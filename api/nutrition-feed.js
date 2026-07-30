const feed = require("../assets/js/nutrition-feed.js");

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(body);
}

function bearerToken(req) {
  const authorization = String(req.headers?.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return send(res, 200, {
      ok: true,
      service: "coach-dominion-nutrition-feed",
      version: feed.VERSION,
      provider: "MyFitnessPal via Apple Health",
      acceptsRawDiary: false
    });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const token = bearerToken(req);
  if (!feed.validateTokenFormat(token)) {
    return send(res, 401, { ok: false, error: "INVALID_FEED_KEY" });
  }
  const normalized = feed.normalizeNutritionFeedPayload(req.body || {});
  if (!normalized.valid) {
    return send(res, 400, { ok: false, error: "INVALID_PAYLOAD", details: normalized.errors });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return send(res, 503, { ok: false, error: "FEED_STORAGE_UNAVAILABLE" });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/ingest_nutrition_feed`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_token: token, p_payload: normalized.payload })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return send(res, 502, { ok: false, error: "FEED_STORAGE_REJECTED" });
    }
    if (!result?.ok) {
      const status = result?.error === "INVALID_FEED_KEY" ? 401 : result?.error === "FEED_DISABLED" ? 403 : 400;
      return send(res, status, result || { ok: false, error: "FEED_REJECTED" });
    }
    return send(res, 200, result);
  } catch (_) {
    return send(res, 502, { ok: false, error: "FEED_STORAGE_UNREACHABLE" });
  }
};
