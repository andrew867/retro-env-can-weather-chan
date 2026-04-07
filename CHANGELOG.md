# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.3.0] - 2026-04-07

### Broadcast reliability & on-air operations

- **Client fetch hardening**: Shared `lib/axios` (display) and `lib/backendAxios` (server) use explicit HTTP timeouts and redirect limits so hung upstream calls do not block the event loop indefinitely.
- **In-flight coalescing**: Hot paths (conditions, historical, national, province, USA, etc.) avoid piling duplicate work when updates arrive faster than completes.
- **`X-RWC-Data-Fetched-At`**: REST responses expose when the server last successfully parsed or aggregated data; the display reads this header (where applicable) so operators can reason about snapshot age.
- **Footer stale hint**: When any tracked feed’s snapshot is older than a threshold (default 25 minutes), a small “ECCC snapshot may be outdated” line appears—oriented toward long ECCC lag or recovery, not clock skew.
- **Recovery refetch (this release)**: After an API outage or restart, the same ECCC observation hour can return an unchanged `observationID` but a **new** `fetchedAt`. The SSE client now **merges** payloads for the same ID (so `fetchedAt` updates). On **EventSource `open`** (including reconnect) and when **`observationID` or `fetchedAt` changes**, the display **refetches all polled feeds** once so national/USA/province/etc. headers refresh immediately instead of waiting for the next poll interval—clearing the stale footer quickly after the server is healthy again.
- **Stale overwrites prevented**: Conditions use `AbortController` + generation guards; national/USA/sunspot-style multi-station fetches use **batch IDs** so late responses from an older wave cannot corrupt a newer wave; polling hooks use **monotonic generation** so slower axios responses do not overwrite newer state.
- **Upstream metrics**: Server-side `backendAxios` response interceptors classify successes, timeouts, 4xx, 5xx, and network errors. **`GET /api/v1/metrics`** exposes counters (cancelled in-flight requests are not counted as errors). Optional **`RWC_METRICS_TOKEN`**: when set, metrics require `Authorization: Bearer <token>`.
- **Health**: **`GET /api/v1/health`** returns `{ ok, service, uptimeSec }` for load balancers and ops.
- **CAP / province DB retention**: Caps and on-disk artifacts respect retention limits with cleanup to avoid unbounded growth.

### GFX & configuration

- **`GfxRuntimeConfig`**: Feature flags, normalized **safe area** (0–1 insets), and **retro** controls (scanline opacity, phosphor tint green/amber/none, vignette). Defaults live in server config; **`POST /api/v1/config/gfx`** persists updates.
- **Display**: `GfxRetroApply` pushes CSS variables and classes onto `#weather_channel`; SCSS adds scanline overlay, phosphor grading, and vignette. Config UI includes a **Graphics** tab (sliders + switches).
- **`GET /api/v1/init`** continues to ship `gfx` for the display bundle.

### Testing & automation

- **Playwright**: `yarn test:e2e` captures full-page screenshots of `/` and `/config` (see `playwright/`). Baseline PNGs use a platform-agnostic snapshot path template.
- **Unit tests**: Added coverage for fetch header parsing, snapshot staleness, and existing suites updated for shared hooks.

### Why this matters for broadcast

- **Predictable recovery**: Viewers and automation see conditions via SSE quickly; auxiliary data (national, US, province, alerts, AQHI, etc.) now **catch up in one coordinated refetch** after reconnect or fresh `fetchedAt`, reducing the window where the footer wrongly implies the whole pipeline is stale.
- **Observable upstreams**: Metrics and optional auth on `/metrics` support monitoring without exposing raw counters on the public internet when token is set.
- **Operator truth**: `fetchedAt` + footer hint align “what’s on screen” with “how old the underlying ECCC/NWS snapshot is,” which is what master control cares about during incidents.

---

## [2.2.2] and earlier

See git history and release tags prior to this file.
