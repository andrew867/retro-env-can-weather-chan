# Specification: operator / dev status dashboard (`/status`)

## References

- Existing patterns:
  - `../../src/api/main.ts` — static `GET /config` → `dist/config.html`
  - `../../src/routes/weather.ts` — weather REST surface
  - `../../src/routes/metrics.ts` — optional `RWC_METRICS_TOKEN` for sensitive read paths
  - `../../src/routes/health.ts`, `../../src/routes/ready.ts` — operational snapshots
- Display config UI: `../../src/display/dist/config.html` (Parcel entry + React shell)

## Goal

Provide a **browser-friendly status view** and a **machine-readable snapshot** of what the server is currently serving: in-memory caches, last successful fetch timestamps, observation IDs, and (where applicable) on-disk artefact hints—plus **explicit refresh controls** for development and controlled operator use.

This is complementary to:

- **`/api/v1/health`** / **`/ready`** — liveness and coarse degradation
- **`/api/v1/metrics`** — counters and circuit state
- **`/config`** — configuration editing, not data-plane introspection

## Non-goals

- Replacing the public display (`/`) or the config editor (`/config`)
- Exposing raw secrets, tokens, or full request/response bodies from upstream APIs
- Unbounded fan-out refresh that ignores existing retry/circuit behaviour (refresh must respect shared HTTP client and circuit rules)
- Shipping this surface **enabled by default on the public internet** without an explicit opt-in and optional authentication (see security requirements)

## Problem

Operators and developers currently infer cache state indirectly (`/weather/*`, `/health`, logs). There is no single pane that answers:

- What snapshot is in memory for each feed?
- When was it last successfully refreshed?
- Is the current row LKG from an older wave?
- Can I force a safe refresh of one feed or all feeds without restarting the process?

## Requirements

### R1 — URL and static shell parity with config

- **`GET /status.html`** or **`GET /status`** (pick one primary; the other may redirect) serves a Parcel-built page from `dist/`, analogous to `GET /config` → `config.html`.
- The page is a **small React (or minimal JS) app** under `src/display/dist/status.html` + entry bundle, consistent with the config UI toolchain.

### R2 — Read-only JSON snapshot API

- **`GET /api/v1/status`** returns a structured JSON document with:
  - **Server** section: uptime, optional build/version string from `package.json` or env, `NODE_ENV` if safe to expose
  - **Citypage / primary conditions** — last successful parse time, `observationID`, `fetchedAt`, brief stale/degraded flags aligned with `/ready` semantics
  - **Per-feed blocks** (at minimum the same families exposed under `/api/v1/weather/*`):
    - forecast, almanac, national (per region or aggregated—implementation defines shape), USA, airport METAR, province tracking, sunspots, hot/cold spots
    - alerts — count, last update time, not necessarily full CAP payload
    - seasons / last-month — last fetch metadata
    - AQHI — station list summary + last fetch
  - Each block includes **`dataFetchedAt`** or equivalent timestamp and **`source`** (`live` vs `lkg` / `cache`) when the server can determine it without duplicating fragile internals
- Response must be **stable and documented** (version field in JSON root recommended, e.g. `statusSchemaVersion: 1`).

### R3 — Refresh controls (POST)

- **`POST /api/v1/status/refresh`** with JSON body:
  - `{ "scope": "all" }` — enqueue refresh for all supported feeds (respecting concurrency and circuits)
  - `{ "scope": "single", "target": "<enum>" }` — refresh one feed family (e.g. `national`, `usa`, `province`, `observed`, `alerts`, …)
- Returns **`202 Accepted`** with a small job descriptor **or** **`200 OK`** with summary of what was triggered—implementation chooses, but behaviour must be documented and tested.
- Refresh must **not** bypass circuit breakers permanently; it may **attempt** a wave consistent with existing `backendAxios` behaviour.
- Optional: idempotency key header for operators automating refresh (future-friendly).

### R4 — Security and deployment defaults

- **Default off in production** unless **`RWC_STATUS_ENABLED=1`** (or equivalent) is set. In non-production (`NODE_ENV=development` / `test`), may default to on for developer ergonomics—document the exact rule in `OPERATORS.md`.
- When **`RWC_METRICS_TOKEN`** (or a dedicated **`RWC_STATUS_TOKEN`**) is set, **`GET /api/v1/status`** and **`POST /api/v1/status/refresh`** require the same **`Authorization: Bearer <token>`** pattern as metrics (reuse is acceptable if documented).
- The **`/status` HTML page** must not embed secrets; it calls the API with fetch and relies on same-origin session or prompts for token in dev only—**prefer** same-origin only + server-side gate.

### R5 — UI expectations (status.html)

- Read-only **tables or cards** per feed: name, last success time, observation or batch id if applicable, LKG flag
- **“Refresh all”** button → `POST .../refresh` with `scope: all`
- **Per-row “Refresh”** → `POST` with `scope: single`, `target: ...`
- Show **last error** per feed **if already available** in memory (no new persistent PII store)
- Clear banner when disabled: “Status API disabled; set `RWC_STATUS_ENABLED=1`”

### R6 — Performance

- Snapshot endpoint should complete in **&lt; 500 ms** typical on a warm process (aggregating in-memory pointers, not re-fetching all upstreams on GET).
- Refresh endpoints trigger async work; must not block the event loop for upstream HTTP.

### R7 — Optional client-payload disclosure (debug)

- Each feed row may offer a control (e.g. chevron / “Payload”) that **fetches the same JSON** the display bundle uses for that feed (`GET /api/v1/weather/…`, `GET /api/v1/season/…`, `GET /api/v1/airquality`, etc.) and shows **pretty-printed** JSON in an expandable region.
- **No new server endpoint required** when existing routes already match the display contract; lazy-fetch on first expand only.
- Same **auth** as the status API when a bearer token is configured (reuse existing axios interceptor).

## Acceptance criteria

- Documented env vars and auth behaviour in **`OPERATORS.md`**
- `GET /api/v1/status` shape is versioned and covered by at least one unit or integration test
- `POST /api/v1/status/refresh` is covered for at least `all` and one `single` target
- Static page loads at **`/status`** (or **`/status.html`**) when enabled and build includes the new bundle
- With status disabled, API returns **404** or **403** consistently (document which)

## Related docs

- [PLAN-status-dashboard.md](./PLAN-status-dashboard.md)
- [TEST-PLAN-status-dashboard.md](./TEST-PLAN-status-dashboard.md)
