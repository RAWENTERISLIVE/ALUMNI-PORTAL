const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length"
]);

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new URL(trimmed);
  const normalizedPath = parsed.pathname.replace(/\/+$/, "");

  if (normalizedPath === "") {
    parsed.pathname = "/api";
  }

  return parsed;
};

const toPath = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return `/${value.map((segment) => encodeURIComponent(segment)).join("/")}`;
  }

  if (typeof value === "string" && value.length > 0) {
    return `/${encodeURIComponent(value)}`;
  }

  return "/";
};

const copyHeaders = (source) => {
  const result = new Headers();

  for (const [key, value] of source.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  }

  return result;
};

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "allow": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      }
    });
  }

  const origin = context.env.API_PROXY_ORIGIN;

  if (!origin?.trim()) {
    return json(
      {
        success: false,
        message:
          "This endpoint has not been migrated to Cloudflare yet. Configure API_PROXY_ORIGIN to proxy legacy backend routes (for example with: wrangler pages secret put API_PROXY_ORIGIN --project-name <your-pages-project>)."
      },
      501
    );
  }

  const incomingUrl = new URL(context.request.url);
  let originUrl;

  try {
    originUrl = normalizeOrigin(origin);
  } catch {
    return json(
      {
        success: false,
        message:
          "API_PROXY_ORIGIN is invalid. Use a fully-qualified URL like https://api.example.com/api"
      },
      500
    );
  }

  if (!originUrl) {
    return json(
      {
        success: false,
        message:
          "API_PROXY_ORIGIN is empty. Set it to your legacy backend base URL (for example https://api.example.com/api)."
      },
      500
    );
  }

  if (originUrl.origin === incomingUrl.origin && originUrl.pathname.replace(/\/+$/, "") === "/api") {
    return json(
      {
        success: false,
        message:
          "API_PROXY_ORIGIN points to this same Pages origin /api and would create a proxy loop. Set it to a separate legacy backend origin."
      },
      500
    );
  }

  const upstreamUrl = new URL(originUrl.toString().replace(/\/+$/, "") + toPath(context.params.catchall));
  upstreamUrl.search = incomingUrl.search;

  const headers = copyHeaders(context.request.headers);
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  const init = {
    method: context.request.method,
    headers,
    redirect: "manual"
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }

  const response = await fetch(upstreamUrl.toString(), init);
  const responseHeaders = copyHeaders(response.headers);
  responseHeaders.set("x-proxied-by", "cloudflare-pages-functions");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
}
