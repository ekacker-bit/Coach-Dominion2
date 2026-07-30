const assert = require("node:assert/strict");
const handler = require("../api/nutrition-feed.js");

function responseHarness() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    }
  };
}

async function run() {
  let passed = 0;

  {
    const res = responseHarness();
    await handler({ method: "GET", headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.acceptsRawDiary, false);
    assert.equal(res.headers["Cache-Control"], "no-store");
    passed += 1;
  }

  {
    const res = responseHarness();
    await handler({ method: "POST", headers: { authorization: "Bearer short" }, body: {} }, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error, "INVALID_FEED_KEY");
    passed += 1;
  }

  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const previousFetch = global.fetch;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    let request = null;
    global.fetch = async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        async json() {
          return { ok: true, dryRun: true, status: "AUTHORIZED" };
        }
      };
    };
    const res = responseHarness();
    await handler({
      method: "POST",
      headers: { authorization: `Bearer cdnf_${"A".repeat(43)}` },
      body: { dryRun: true }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "AUTHORIZED");
    assert.match(request.url, /rest\/v1\/rpc\/ingest_nutrition_feed$/);
    assert.equal(request.options.headers.apikey, "public-anon-key");
    assert.equal(JSON.parse(request.options.body).p_payload.dryRun, true);
    passed += 1;
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
    global.fetch = previousFetch;
  }

  console.log(`Nutrition feed API: ${passed} tests passed.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
