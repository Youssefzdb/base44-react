# Base44 React — platform frontend

React 19 (Vite) rebuild of the base44 app UI — same pages, same logic,
tokens **from base44 production** (`public/tokens.css`, fonts woff2 pulled
from base44's own endpoints).

## Pages (hash routes)

| route | screen |
|---|---|
| `#/#/login` | auth: signup/login toggle + demo workspace button |
| `#/` | home: hero prompt + apps grid + credits widget |
| `#/app/:id` | **builder**: agent chat (steps timeline) + tabs Preview / Code / Data / Logs / Publish (+ custom domain) |
| `#/explore` | templates: CRM, Task Manager, Blog, Expense Tracker, Notes |
| `#/settings` | appearance (light/dark/system, pre-paint contract) · language · **members & invite** · **plan upgrade** · session |
| `runtime.html#app=:id` | app preview runtime (entity tables + add-record, accent-themed) |

## Run (dev)

```sh
pnpm install
# backend: /root/base44-platform/server.py on :8510 (proxies /api,/p,/ws)
pnpm dev            # → http://localhost:8520
```

## Build & serve from the backend

```sh
pnpm build          # → dist/
# base44-platform/server.py auto-detects ../base44-react/dist and serves it
cd ../base44-platform && python3 server.py   # → http://localhost:8510
```

## Verified

- [x] `pnpm build` clean (243 KB JS, gzip 75.6 KB)
- [x] `pnpm lint` — 0 errors (few fast-refresh warnings)
- [x] login → home → create app (agent templates) → builder tabs → publish → `/p/:slug`
- [x] credits decrement per agent turn (0.4), 402 when dry
- [x] members invite list, workspace create + switcher, billing subscribe (pro=100 credits)
- [x] domain verify flow: pending → verified after 3s (mock TXT)
