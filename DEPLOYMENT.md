# Deployment

The frontend is a Vite/React SPA served by a small Node/Express server
(`server.js`) on Azure App Service for Linux (Node 22). That server also
reverse-proxies `/api` to the backend, so the browser only ever talks to a
single origin (`https://smarthome.georgeboca.dev`). That means **no CORS
configuration is needed on the backend**, and the realtime WebSockets
(notifications + Gemini chat) work through the same proxy.

## How the proxy maps routes

This mirrors the Vite dev-server proxy (see `vite.config.ts`):

| Browser request            | Proxied to backend                     |
| -------------------------- | -------------------------------------- |
| `/api/gemini/*`            | `<backend>/api/gemini/*` (prefix kept) |
| `/api/*` (everything else) | `<backend>/*` (`/api` stripped)        |
| anything else              | `index.html` (SPA fallback)            |

The backend host comes from the `BACKEND_HOST` env var (defaults to the current
backend host in `server.js`). Override it with an App Service app setting if it
ever changes.

## Local test

```bash
npm ci
npm run build      # populates dist/
npm start          # server on http://localhost:8080
```

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml` runs on push to `main`:

1. **test** — `npm run lint` + `npm run build` (the build runs `tsc -b`, so it is
   also the typecheck gate). There is no unit-test runner in the project yet;
   add one and a `test` step here when you have tests.
2. **deploy** — re-runs `npm ci` + `npm run build`, prunes dev dependencies, zips
   `server.js`, `package.json`, `package-lock.json`, `dist/`, `node_modules/`,
   and pushes the zip to App Service via `azure/webapps-deploy`.

### Required repository configuration

Secret (`Settings → Secrets and variables → Actions → Secrets`):

| Secret                         | What it is                                                                |
| ------------------------------ | ------------------------------------------------------------------------- |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish profile downloaded from the App Service (*Get publish profile*) |

Variable (`… → Variables`):

| Variable            | What it is                          |
| ------------------- | ----------------------------------- |
| `AZURE_WEBAPP_NAME` | The App Service name (frontend app) |

A GitHub *Environment* named `production` is also referenced by the workflow.
You can create it with no protection rules, or add manual-approval rules later.

## One-time Azure setup

1. **Resource group + App Service Plan + Web App** (Linux, Node 22). B1 or
   higher is required if you want a custom domain + managed cert. Free F1 works
   on the default `*.azurewebsites.net` URL.
2. **App settings** on the Web App:
   - `SCM_DO_BUILD_DURING_DEPLOYMENT=false` — we ship a pre-built `dist/` and
     populated `node_modules/`, so Oryx must not try to rebuild on the server.
   - `BACKEND_HOST=...` only if you need to override the default backend host.
3. **Startup command** (Configuration → General settings): `node server.js`.
4. **Custom domain + TLS** for `smarthome.georgeboca.dev`:
   - DNS: CNAME `smarthome` → `<app-name>.azurewebsites.net`, plus a TXT record
     `asuid.smarthome` with the value App Service shows you.
   - In App Service → *Custom domains* → add the domain, then create and bind an
     *App Service Managed Certificate* (SNI SSL). Turn on *HTTPS Only*.
