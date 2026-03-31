const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });

export async function onRequestGet(context) {
  const checks = {
    d1: { ok: false, detail: "not checked" },
    r2: { ok: false, detail: "not checked" }
  };

  try {
    const table = await context.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'uploads'"
    ).first();
    checks.d1 = {
      ok: true,
      detail: table ? "uploads table found" : "uploads table missing"
    };
  } catch (error) {
    checks.d1 = {
      ok: false,
      detail: error instanceof Error ? error.message : "D1 query failed"
    };
  }

  try {
    const listed = await context.env.UPLOADS_BUCKET.list({ limit: 1 });
    checks.r2 = {
      ok: true,
      detail: `connected (${listed.objects.length} sample objects returned)`
    };
  } catch (error) {
    checks.r2 = {
      ok: false,
      detail: error instanceof Error ? error.message : "R2 list failed"
    };
  }

  const ok = checks.d1.ok && checks.r2.ok;

  return json(
    {
      success: ok,
      message: ok
        ? "Cloudflare storage bindings are ready"
        : "One or more storage bindings are unavailable",
      data: {
        checks,
        timestamp: new Date().toISOString()
      }
    },
    ok ? 200 : 503
  );
}
