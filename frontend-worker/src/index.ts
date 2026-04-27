import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

interface Env {
  __STATIC_CONTENT: Record<string, unknown>;
  API_PROXY_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

// Proxy /api/* requests to backend Worker
app.all('/api/*', async (c) => {
  const url = new URL(c.req.url);
  const backendUrl = new URL(c.env.API_PROXY_ORIGIN + url.pathname + url.search);

  const init: RequestInit = {
    method: c.req.method,
    headers: new Headers(c.req.raw.headers),
  };

  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = c.req.raw.body;
  }

  // Remove host header to avoid conflicts
  init.headers.delete('host');

  try {
    const response = await fetch(backendUrl.toString(), init);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return c.json(
      {
        success: false,
        message: 'Backend API is temporarily unavailable',
      },
      502
    );
  }
});

// Serve static assets from /dist
app.get('*', serveStatic({ root: './' }));

// SPA fallback: serve index.html for all non-asset routes
app.get('*', async (c) => {
  // Check if it's a static asset request (has file extension)
  const pathname = new URL(c.req.url).pathname;
  if (/\.\w+$/.test(pathname)) {
    return c.notFound();
  }

  // Serve index.html for all other routes (client-side routing)
  return serveStatic({ path: 'index.html' })(c);
});

export default app;
