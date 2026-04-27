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

const copyHeaders = (source) => {
  const result = new Headers();

  for (const [key, value] of source.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  }

  return result;
};

const getApiSuffix = (pathname) => {
  const suffix = pathname.replace(/^\/api(?=\/|$)/, "");
  return suffix || "/";
};

const proxyApiRequest = async (request, env) => {
  // If we have a service binding, use it!
  if (env.BACKEND) {
    const url = new URL(request.url);
    console.log(`Using Service Binding for ${request.method} ${url.pathname}`);
    return env.BACKEND.fetch(request);
  }

  const origin = env.API_PROXY_ORIGIN;
  const incomingUrl = new URL(request.url);

  if (!origin?.trim()) {
    return json(
      {
        success: false,
        message:
          "This endpoint has not been migrated to Cloudflare yet. Configure API_PROXY_ORIGIN to proxy legacy backend routes (for example with: wrangler secret put API_PROXY_ORIGIN --name <your-worker-name>)."
      },
      501
    );
  }

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
          "API_PROXY_ORIGIN points to this same Worker origin /api and would create a proxy loop. Set it to a separate backend origin."
      },
      500
    );
  }

  const upstreamPath = getApiSuffix(incomingUrl.pathname);
  const upstreamUrl = new URL(originUrl.toString().replace(/\/+$/, "") + upstreamPath);
  upstreamUrl.search = incomingUrl.search;

  const headers = copyHeaders(request.headers);
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  const response = await fetch(upstreamUrl.toString(), init);
  console.log(`Proxied ${request.method} ${incomingUrl.pathname} -> ${upstreamUrl.toString()} [${response.status}]`);

  const responseContentType = (response.headers.get("content-type") || "").toLowerCase();
  if (response.status === 530 && responseContentType.includes("text/html")) {
    const upstreamBody = await response.text();
    const isOriginDnsError = /origin dns error|error\s*1016|trycloudflare\.com/i.test(
      upstreamBody
    );

    if (isOriginDnsError) {
      return json(
        {
          success: false,
          message:
            "Legacy API upstream DNS failed. Update API_PROXY_ORIGIN to a stable backend URL (for example https://api.example.com/api) and redeploy."
        },
        502
      );
    }

    return json(
      {
        success: false,
        message: "Legacy API upstream returned HTML error page with status 530."
      },
      502
    );
  }

  const responseHeaders = copyHeaders(response.headers);
  responseHeaders.set("x-proxied-by", "cloudflare-worker");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
};

const handleHealth = (env) =>
  json({
    success: true,
    message: "MPSAJMER CONNECT Cloudflare Worker is healthy",
    data: {
      runtime: "cloudflare-workers",
      appEnv: env.APP_ENV || "unknown",
      proxyConfigured: Boolean(env.API_PROXY_ORIGIN?.trim()),
      timestamp: new Date().toISOString()
    }
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isApiRoute = url.pathname === "/api" || url.pathname.startsWith("/api/");

    if (url.pathname === "/api/health") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            allow: "GET,OPTIONS"
          }
        });
      }

      if (request.method === "GET") {
        return handleHealth(env);
      }

      return json(
        {
          success: false,
          message: "Method not allowed"
        },
        405
      );
    }

    if (isApiRoute) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            allow: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
          }
        });
      }

      return proxyApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
