# HTTP API (automation & integration)

The channel exposes a JSON API under **`/api/v1`** (default listen port **`8600`**). The config UI is optional: any client can drive the same endpoints.

## Reference material

| File | Purpose |
|------|---------|
| **[openapi.yaml](./openapi.yaml)** | OpenAPI 3.0 machine-readable description (import into Postman, Insomnia, codegen, or contract tests). |
| **[OPERATORS.md](../../OPERATORS.md)** | Environment variables, auth tokens, MSC mirrors, release checklist. |
| **[REST-COOKBOOK.md](./REST-COOKBOOK.md)** | Copy-paste **`curl`** examples for common automation flows. |

## Base URL

```
http://127.0.0.1:8600/api/v1
```

Override host/port per deployment. The display bundle often uses `window.location.origin` for same-origin calls.

## Authentication (optional)

| Endpoint family | When `Authorization` is required |
|-----------------|-----------------------------------|
| **`GET/POST /metrics`** | If **`RWC_METRICS_TOKEN`** is set: `Authorization: Bearer <token>`. |
| **`GET/POST /status`** | If **`RWC_STATUS_TOKEN`** or **`RWC_METRICS_TOKEN`** is set (see OPERATORS): same bearer scheme. |

Config, flavour, weather, init, health, and ready routes are **unauthenticated** by default—treat the listener as **trusted LAN** or put a reverse proxy in front (see OPERATORS **Deployment & network exposure**).

## Streaming / long-lived responses

| Path | Content type | Notes |
|------|----------------|------|
| **`GET /weather/live`** | `text/event-stream` | SSE primary conditions stream. |
| **`GET /weather/alerts/stream`** | `text/event-stream` | SSE alerts stream. |
| **`GET /init/stream`** | `text/event-stream` | SSE init/crawler refresh hints. |

These are summarized in `openapi.yaml` but not fully modeled as SSE event schemas.

## Post-deploy verification

With the API process listening:

```bash
BASE_URL=http://127.0.0.1:8600 yarn smoke
```

If **`RWC_METRICS_TOKEN`** is set on the server, pass the same token to smoke:

```bash
METRICS_TOKEN=your-secret BASE_URL=http://127.0.0.1:8600 yarn smoke
```

## Release candidate gate (local / CI)

```bash
yarn gate:rc          # typecheck + unit tests
BASE_URL=... yarn smoke   # requires running server
yarn gate:rc:e2e      # gate:rc + Playwright (starts server + builds display)
```

See [OPERATORS.md](../../OPERATORS.md) § *Release candidate checklist*.
