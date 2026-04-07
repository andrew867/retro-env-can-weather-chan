# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.4.0] - 2026-04-07

### Province high/low grid (cold start)

- **Running min and max** per station from each successful citypage fetch, so **temperatures fill on the first cycle** after install or restart—no dependency on a prior “overnight only” tracking window.
- **`displayTemp`** is recomputed after every batch (`applyDisplayTempsFromTrackers`) so the UI does not stay on **`M`** while trackers are valid.
- **Sentinels** use **`null`** instead of `Math.min()` / `Math.max()` for cleared trackers (clearer JSON on disk).

### GFX vignette

- **Visible vignette**: inset shadow on `#weather_channel` sat **under** opaque child layers; a **`gfx-vignette-layer`** div now sits **above** `.rwc-channel-frame` with the same `box-shadow` driven by **`--gfx-vignette`**.
- **Default** `gfx.retro.vignetteStrength` raised to **0.12** so a fresh install shows a subtle edge without config UI tweaks.

### AMQP / Sarracenia Phase 0

- **`RWC_AMQP_HOST`**, **`RWC_AMQP_PORT`**, **`RWC_AMQP_USER`**, **`RWC_AMQP_PASSWORD`** override MSC broker connection for **`listen()`** (conditions + CAP alerts). Defaults unchanged.
- **ADR**: [docs/specs/ADR-002-sarracenia-amqp-and-phase0.md](./docs/specs/ADR-002-sarracenia-amqp-and-phase0.md).

### Docs & repo hygiene

- **`docs/specs/`** is tracked (gitignore exception) for ADRs and Sarracenia plans.

---

## [2.3.0] - 2026-04-07

### Broadcast reliability & on-air operations

- **Client fetch hardening**: Shared `lib/axios` (display) and `lib/backendAxios` (server) use explicit HTTP timeouts and redirect limits so hung upstream calls do not block the event loop indefinitely.
- **In-flight coalescing**: Hot paths (conditions, historical, national, province, USA, etc.) avoid piling duplicate work when updates arrive faster than completes.
- **`X-RWC-Data-Fetched-At`**: REST responses expose when the server last successfully parsed or aggregated data; the display reads this header (where applicable) so operators can reason about snapshot age.
- **Footer stale hint**: When any tracked feed’s snapshot is older than a threshold (default 25 minutes), a small “ECCC snapshot may be outdated” line appears—oriented toward long ECCC lag or recovery, not clock skew.
- **Recovery refetch (this release)**: After an API outage or restart, the same ECCC observation hour can return an unchanged `observationID` but a **new** `fetchedAt`. The SSE client now **merges** payloads for the same ID (so `fetchedAt` updates). On **EventSource `open`** (including reconnect) and when **`observationID` or `fetchedAt` changes**, the display **refetches all polled feeds** once so national/USA/province/etc. headers refresh immediately instead of waiting for the next poll interval—clearing the stale footer quickly after the server is healthy again.
- **Stale overwrites prevented**: Conditions use `AbortController` + generation guards; national/USA/sunspot-style multi-station fetches use **batch IDs** so late responses from an older wave cannot corrupt a newer wave; polling hooks use **monotonic generation** so slower axios responses do not overwrite newer state.
- **Upstream metrics**: Server-side `backendAxios` response interceptors classify successes, timeouts, 4xx, 5xx, and network errors. **`GET /api/v1/metrics`** exposes counters (cancelled in-flight requests are not counted as errors). Optional **`RWC_METRICS_TOKEN`**: when set, metrics require `Authorization: Bearer <token>`.
- **Display metrics**: The browser `axios` instance (`lib/axios`) uses the same counter model; the display posts **`POST /api/v1/metrics/client`** on an interval while `/` is open. **`GET /api/v1/metrics`** includes `displayAxiosFromClient` and `displayAxiosReportedAt` (last report wins).
- **Look and feel**: Configurable **footer freshness hint** (show/hide the “snapshot may be outdated” line) and **ECWC/GWCV official fonts** vs **legacy** (consolas + ws4000 crawler), default **official on** for upstream typography parity.
- **Docs**: [OPERATORS.md](./OPERATORS.md) for deploy/git/`yarn.lock` on servers, env vars, and metrics.
- **Health**: **`GET /api/v1/health`** returns `{ ok, service, uptimeSec }` for load balancers and ops.
- **CAP / province DB retention**: Caps and on-disk artifacts respect retention limits with cleanup to avoid unbounded growth.

### GFX & configuration

- **`GfxRuntimeConfig`**: Feature flags, normalized **safe area** (0–1 insets), and **retro** controls (scanline opacity, **colour preset** none / NES-style / C64-style / CRT green or amber, vignette, optional **broadcast analog / VHS-style** overlay, **`reloadLineMs`** for forecast line-reveal stagger). Defaults live in server config; **`POST /api/v1/config/gfx`** persists updates (JSON field remains `phosphorTint` for compatibility).
- **Display**: `GfxRetroApply` pushes CSS variables and classes onto `#weather_channel`; SCSS adds scanline overlay, optional grading filters, and vignette. Config **Graphics** tab copy frames broadcast colour as default and RetroArch-style presets for 8-bit or CRT mono looks.
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
