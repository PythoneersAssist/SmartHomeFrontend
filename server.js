import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const PORT = process.env.PORT || 8080;
const BACKEND_HOST =
  process.env.BACKEND_HOST ||
  'smarthome-backend-gpc5bjfdfjaqa5d5.spaincentral-01.azurewebsites.net';
const BACKEND_URL = `https://${BACKEND_HOST}`;

// Gemini routes live under /api/gemini on the backend — keep the prefix.
const geminiProxy = createProxyMiddleware({
  pathFilter: '/api/gemini',
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  xfwd: true,
});

// All other /api/* routes are served at the backend root, so strip the prefix
// (mirroring the rewrite the Vite dev server does in development).
const apiProxy = createProxyMiddleware({
  pathFilter: '/api',
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  xfwd: true,
  pathRewrite: { '^/api': '' },
});

const app = express();

app.use(geminiProxy);
app.use(apiProxy);

// Hashed Vite assets are content-addressed, so cache aggressively. Everything
// else (including index.html) is served without long-lived caching.
app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);
app.use(express.static(distDir, { index: false }));

// SPA fallback: client-side routes resolve to index.html.
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(
    `Frontend listening on :${PORT}, proxying /api to ${BACKEND_URL}`
  );
});

// http-proxy-middleware needs to be wired into the underlying server's
// `upgrade` event for WebSockets. Dispatch by URL so each proxy sees its own.
server.on('upgrade', (req, socket, head) => {
  if (!req.url) {
    socket.destroy();
    return;
  }
  if (req.url.startsWith('/api/gemini')) {
    geminiProxy.upgrade(req, socket, head);
  } else if (req.url.startsWith('/api')) {
    apiProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});
