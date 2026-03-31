const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });

export async function onRequestGet(context) {
  return json({
    success: true,
    message: "Alumni Portal Cloudflare API is healthy",
    data: {
      runtime: "cloudflare-pages-functions",
      appEnv: context.env.APP_ENV || "unknown",
      timestamp: new Date().toISOString()
    }
  });
}
