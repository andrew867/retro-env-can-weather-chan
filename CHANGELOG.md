# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.6.6] - 2026-04-08

### Display

- **Airport METAR:** Row text is built in a single span (avoids extra `white-space: pre` gaps between columns) and uses one space between temperature and condition instead of two, so four-letter flight categories (e.g. MVFR) no longer push the temperature past the plate edge.

---

## [2.6.5] - 2026-04-09

### Operator status dashboard

- **`/status` UI** (Parcel): read-only view of feed health and last successful fetch times; optional **`RWC_STATUS_ENABLED=1`** in production, open in dev when `NODE_ENV` is not production.
- **API:** **`GET /api/v1/status`** JSON snapshot; **`POST /api/v1/status/refresh`** with `{ "scope": "all" | "<feed>" }` to trigger poll/refresh (optional **`Authorization: Bearer <RWC_STATUS_TOKEN>`**).
- **Snapshot plumbing:** `lib/status/buildSnapshot` aggregates modules that expose **`getLastFetchIso`** / **`getDataFetchedAtForHeader`**-style metadata (conditions, alerts, province tracking, national, USA, airport METAR, AQHI, climate normals, historical bulk, sunspots, hot/cold spots, season).
- **Docs:** [SPEC-status-dashboard.md](./docs/specs/SPEC-status-dashboard.md), plans and test notes under **`docs/specs/`**.
- **Tests:** Jest **`statusDashboard.test.ts`**; Playwright **`status-dashboard-visual.spec.ts`** (baseline screenshot).

### Province temp/precip grid

- **24 h precipitation:** When citypage **`yesterdayConditions`** is missing, stations can fall back to **ECCC climate daily bulk** (`provinceYesterdayClimatePrecip`) using optional **`climateStationId`** on **`ProvinceStation`**; shipped Manitoba defaults include mapped station IDs; config loader **merges** IDs by matching **`code`** when JSON omits them.
- **`provinceTracking`:** Async climate fetch after citypage parse; in-memory cache (~45 min per station/day) to limit bulk traffic on the five-minute refresh.
- **Rehydrate `station` from config:** Rows loaded from **`db/province_tracking.json`** only stored **`name`/`code`**, so **`climateStationId`** was dropped after restart and climate fallback never ran; **`initialize()`** now replaces each row’s **`station`** with the matching **`provinceStations`** entry (normalized code match).

### Display / retro (VHS)

- **Head-switch tear:** **`VhsHeadSwitchTearLayer`** + **`gfx.retro.vhsHeadSwitchTearEnabled`** (Graphics config); bottom band with low-rate **`--gfx-vhs-tear-x`** jitter; **`rwc-channel-stack`** wraps the raster so the tear anchors to the **4:3/HD picture** in **16:9** letterboxed layouts (was often invisible on black pillars); slightly stronger **overlay** blend and opacity.
- **Flavours editor:** **`SCREEN_NAMES`** entry for **`AIRPORT_METAR`** so the screen dropdown shows a label (value was already correct).

### Other

- **`.dockerignore`:** Ignore `node_modules`, `dist`, `coverage`, local `cfg`/`db` artifacts for leaner image contexts.
- **`.gitignore`:** Ignore **`/output`** (Playwright/local dumps); replace overly broad **`build*`** with **`/build`** so **`buildSnapshot.ts`** is not excluded.
- **Version:** **`2.6.5`** in **`package.json`**.

---

## [2.6.4] - 2026-04-08

### Display polish

- **VHS layout fidelity:** Restored the plate structure to the historical look by removing the in-plate title strip, reducing crawler dominance, widening forecast/almanac fit, and rebalancing province temp/precip spacing.
- **Bottom row safety:** Kept a modest bottom-safe cushion in `#rwc-screen-body` so the last visible line fares better without overflow bleed or native scrollbars.

### Public docs and release metadata

- **`OPERATORS.md`:** Reworded the GitHub mirror workflow so it reads cleanly in the public repo while keeping the subtree publish instructions intact.
- **`HISTORY-AUTHENTICITY.md`:** Replaced the private-workspace note with links to the public specs and test-plan docs now tracked in the repository.
- **Version metadata:** Bumped the active development version to **`2.6.4`** in `package.json`.

---

## [2.6.3] - 2026-04-08

### Display layout and readability

- **Frame math:** `#display` uses **flex** (`flex: 1 1 0`, `min-height: 0`) between crawler and footer instead of a fixed pixel height, so the middle band always fills the channel frame.
- **HD / `--rwc-ui-scale`:** Crawler and footer bar **heights scale** with resolution; **`GfxRetroApply`** sets **`--channel-max-height`** / **`--channel-max-width`** so gfx safe-area padding matches the scaled raster (fixes clipped last lines when logical resolution is doubled).
- **Screen title strip:** **`#rwc-screen-title`** in the rotator shows the active screen name and city (distinct from the crawler headline strip).
- **Footer:** Slightly more bottom padding on **`#footer_bar`** so branding text is not clipped.
- **Province temp/precip:** Narrower gap column, slightly **smaller font** on `#province_tracking_screen`, and **`min-width: 0`** on **`#rwc-screen-body`** so wide monospace rows are not cut off on the right.

### Display reliability (partial / malformed data)

- **`mergeDefined`:** Same-`observationID` condition SSE merges **skip `undefined` patch keys** so `{ ...prev, ...parsed }` cannot wipe **`observed`** or **`stationTime`** when the server omits fields.
- **`displayTime`:** **`adjustObservedDateTimeToStationTime`**, **`formatObservedLong`**, **`formatSunspotDate`**, **`formatObservedMonthDate`**, and day offset helpers **guard** missing or invalid **`observedDateTime`**.
- **`lib/display/safeData`:** **`coerceArray`**, **`coerceStringLines`**, **`isPlainObject`** — used by list/line UIs and SSE handlers so non-array JSON does not crash **`.map`** / **`.length`**.
- **Hooks:** **`useWeatherEventStream`** accepts only **plain-object** condition payloads; **`useAlerts`** REST and SSE require **`alerts`** to be an **array**.
- **Screens / crawler:** Defensive coercions and optional chaining on **forecast**, **national**, **airport METAR**, **outlook**, **info**, **crawler**, **province tracking**, **sunspots**; safer **Conditions** / **almanac** / **forecast** / **last month** / **AQHI** props.

### Docs

- **[OPERATORS.md](./OPERATORS.md):** Public GitHub mirror via **`git subtree split`**, **HTTPS** remote example, hygiene for neutral wording, and reminder not to push the full parent repository to **`github`**.

### Tests

- **`mergeDefined.test.ts`**, **`safeData.test.ts`**.

---

## [2.6.2] - 2026-04-07

### Reliability and operations (release hardening)

- **Last-known-good (LKG)** for auxiliary JSON: national regions, USA list, airport METAR, and province tracking keep an in-memory snapshot (default max age **90 min**, `RWC_LKG_MAX_AGE_MS`). **`X-RWC-Data-Fetched-At`** uses `getDataFetchedAtForHeader()` so the footer reflects **snapshot age** when serving cached rows, not wall-clock pretend-fresh.
- **Bounded HTTP retries:** NWS and AWC use `axiosGetWithRetry` (jittered backoff, per-host circuit). MSC mirror (`axiosGetWithMscMirror`) no longer runs **extra retry waves** after both HPFX and Datamart return terminal **4xx** (fixes redundant requests and stuck tests); waves still apply for **5xx**, **429**, **408**, and network errors.
- **Per-upstream circuit:** cool-off state is exposed on **`GET /api/v1/metrics`** as **`upstreamCircuits`**. Env: `RWC_CIRCUIT_FAILURE_THRESHOLD`, `RWC_CIRCUIT_COOL_OFF_MS`.
- **Health and readiness:** **`GET /api/v1/health`** adds **`degraded`** (`citypageStale`, `upstreamCircuitCoolOff`). New **`GET /api/v1/ready`** returns **503** with `reason: "citypage_data_stale"` when the last successful citypage parse exceeds **`RWC_CITYPAGE_STALE_FALLBACK_AFTER_MS`** (or there was never a parse).
- **Structured upstream logs:** optional **`[upstream]`** lines on `backendAxios` when `config.rwcUpstream` is set; disable with **`RWC_STRUCTURED_UPSTREAM_LOG=0`**.
- **Config validation:** warnings at load for malformed `primaryLocation`, `airportMetarStations`, and out-of-range flavour screen ids (`configValidation.ts`).
- **Disk guard:** optional startup WARN via **`fs.statfsSync`** when free space &lt; **`RWC_MIN_DISK_FREE_MIB`** (0 = off).
- **Metrics kill switch:** **`RWC_METRICS_DISABLED=1`** returns **404** for **`GET /api/v1/metrics`** (health unaffected).
- **AMQP reconnect override:** **`RWC_AMQP_RECONNECT_LIMIT_MS`** maps to `amqp_reconnect_limit_ms` / `reconnectExponentialLimit` in `sarra-canada-amqp.js`.

### Tooling and docs

- **`yarn smoke`** / **`node scripts/post-deploy-smoke.mjs`** — checks `/health`, `/ready`, `/weather/observed`, `/weather/usa`, `/weather/airport-metar` (optional **`BASE_URL`**).
- **Operator and spec docs:** [OPERATORS.md](./OPERATORS.md) env matrix and runbook; [PLAN-release-hardening.md](./docs/specs/PLAN-release-hardening.md) and [PLAN-sarracenia-data-tranche.md](./docs/specs/PLAN-sarracenia-data-tranche.md) marked complete; [POLL-vs-PUSH-matrix.md](./docs/specs/POLL-vs-PUSH-matrix.md), [INVENTORY-feeds.md](./docs/specs/INVENTORY-feeds.md), [TEST-PLAN-sarracenia-data-tranche.md](./docs/specs/TEST-PLAN-sarracenia-data-tranche.md) updated.

### Tests

- **`configValidation`**, **`sarraAmqpListen`** (AMQP reconnect options), **`mscAmqpEnv`** reconnect env, **`mscAmqpStats`** + `upstreamCircuits`; AQHI / ECCC station list tests pin **`RWC_HTTP_RETRY_COUNT=0`** for deterministic moxios counts.

---

## [2.6.1] - 2026-04-07

### Real-time ingest (MSC / Sarracenia AMQP — already in use)

- **Citypage + forecast**: `GET /api/v1/weather/live` is now **push-driven** when ECCC citypage XML is parsed (MSC AMQP `*.WXO-DD.citypage_weather.<province>.#` → HTTP fetch → `condition_update` + **`forecast_update`** SSE). Initial connect still sends **two events immediately** (no wait for a poll interval). A **30s** SSE comment ping keeps connections alive behind proxies.
- **CAP / NAADS-style alerts**: Still ingested over the same public MSC AMQP broker (`*.WXO-DD.alerts.cap.#`). New **`GET /api/v1/weather/alerts/stream`** pushes **`alerts_update`** when the CAP list changes; the display uses EventSource + a **10-minute** HTTP fallback poll.

### Observability

- **`mscAmqp`** on **`GET /api/v1/health`** / **`GET /api/v1/metrics`**: per-role counters (`messageCount`, `errorEventCount`) and ISO timestamps (`lastMessageAt`, `lastErrorAt`) for the **citypage** and **alerts** `listen()` subscribers.

### Forecast continuation / authentic streaming fixes

- **Continuation off + multi-page reload**: the **0.05s** “skip first page” dwell now applies only when there is a **single** forecast body; otherwise the full **14s** dwell runs so staggered reload can finish across pages.
- **Continuation on (non-reload passes)**: secondary pages use authentic streaming whenever the feature is enabled (not only during `isReload`), so “forecast cont..” no longer stalls after the clear bar.
- **Clear → stream handoff**: clear-hold timeouts no longer cancel when grapheme counts change mid-effect; continuation phase resets in **`useLayoutEffect`** so stale `done` cannot unblock the page timer before the new page’s stream state is applied.

### ECCC citypage — production-grade HTTP path (conditions + datamart consumers)

**Problem addressed:** Datamart (`https://dd.weather.gc.ca`) does **not** mirror the legacy HPFX-only tree `…/today/citypage_weather/xml/{province}/{id}_e.xml`. Hourly citypage files live under `…/today/citypage_weather/{province}/{UTC hour}/…`. Listing and GET had to use the **same host** that served the directory index; building file URLs only on `hpfx.collab.science.gc.ca` after a successful read from Datamart caused intermittent **404** on national / province / secondary fetches.

**Datamart resolver (`GetWeatherFileFromECCC`):**

- Directory listing uses **`axiosGetWithMscMirrorResolved`**: the **resolved URL** (HPFX or Datamart) drives the base for the English `MSC_CitypageWeather_{station}_en.xml` link.
- Multiple UTC hour buckets (**8** hours) and multiple timestamped `href`s per station (newest first) are tried; each candidate is checked with **`HEAD`** across mirrors before returning a URL so “phantom” listing rows do not win.

**Primary station conditions (`runConditionsFetch`) — ordered fallbacks:**

1. **AMQP push URL** when present (fast path; `normalizeMscHttpUrl`).
2. **Hourly bucket URL** from `GetWeatherFileFromECCC` (same resolver as national/province).
3. **Legacy HPFX** `…/xml/{province}/{id}_e.xml` via **`legacyHpfxCitypageEnglishXmlUrl`** (exported from `datamart.ts`) — last resort; Datamart usually 404s this path, HPFX may still serve it.

**Ops notes:** No change to AMQP topic (`*.WXO-DD.citypage_weather.<province>.#`). Stale HTTP fallback and bootstrap both use the chain above. **`RWC_MSC_TRY_DATAMART_FIRST`** still controls mirror order for MSC HTTP.

### USA — NWS `api.weather.gov` + NOAA AWC METAR backup

**Problem addressed:** `api.weather.gov/.../observations/latest` can return **503** / 5xx (service unavailable) even when METAR exists elsewhere.

**Behaviour:** For each US station, the server tries **NWS latest observation** first. On failure types that indicate overload or outage (**5xx**, **429**, **408**, or network errors — **not** 4xx client errors such as unknown station), it falls back to **NOAA Aviation Weather Center METAR** JSON: `GET https://aviationweather.gov/api/data/metar?ids={ICAO}&format=json`. Temperature and a short condition line (flight category, sky cover, wind when present) are mapped into the same fields as the NWS path. A log line **`using AWC METAR backup (NWS observation unavailable)`** is emitted when the backup path is used.

**Ops notes:** AWC is a **different service** than NWS API — not a second identical mirror, but a practical backup for the same ICAO observation family. Respect AWC/NWS acceptable use; default poll cadence unchanged (**5 min**).

### Airport conditions screen — ICAO METAR (Canada / US / international)

**New rotator screen:** **`Screens.AIRPORT_METAR`** (“Airport conditions (METAR)”), included in the **default flavour** after **USA regional conditions**.

**Config (`cfg/rwc-config.json`):** array **`airportMetarStations`** — up to **4** entries: `{ "name": "Winnipeg", "code": "CYWG" }`. ICAO codes are normalized to uppercase; invalid entries are dropped. Example in repo default config: **CYWG**, **CYYZ**, **CYVR**.

**Server:** batch fetch from the same AWC METAR endpoint (one HTTP request for all configured ids). **`GET /api/v1/weather/airport-metar`** returns the filtered reporting rows and **`X-RWC-Data-Fetched-At`** when any station updated successfully. Display polls on the same **5 min** interval as USA weather; recovery refetch includes airport METAR after SSE reconnect.

**Layout:** Same typography / column pattern as national regional screens (name, °C, abbreviated condition).

### Reference: NWS FTP “selected cities” lists vs automation

Curated text lists under **`ftp://tgftp.nws.noaa.gov`** (e.g. `data/summaries/selected_cities/current/…`, anonymous FTP) are useful **human references** for picking ICAO stations and city names. They are **not** wired into the app as a second HTTP source: parsing FTP directories from the broadcast server is brittle and redundant now that **AWC’s documented JSON API** backs up NWS and powers the airport screen. Keep those files as editorial reference alongside `airportMetarStations` in config.

---

## [2.6.0] - 2026-04-07

### Forecast continuation & authentic streaming

- **Page advance gating**: Multi-page forecast no longer advances on a fixed timer while the first page or a continuation page is still **authentic-streaming** (`pageAdvanceBlocked` waits for `authenticPhase === 'done'` and continuation `contPhase === 'done'`). After streaming completes, the usual **14s** dwell runs before the next page or `onComplete` — fixing stalls where the rotator advanced before long text finished.
- **Continuation pages**: With **`authenticRefresh.continuationGraphemeReveal`** on by default, continuation screens use the same grapheme typing reveal as page 0 on reload; with it off, full static lines still show (see Graphics → **Continuation grapheme reveal**).

### Init & ops

- **SSE**: **`GET /api/v1/init/stream`** pushes **`crawler_update`** when crawler lines change; the display refetches init on that event and polls init less often (**30s**).
- **Health**: **`GET /api/v1/healthz`** mirrors **`GET /api/v1/health`**.

### Tests

- **`forecastContinuation.test.ts`**: Pagination line budgets match the forecast screen so multi-page text is not truncated at the formatter layer.

---

## [2.5.0] - 2026-04-07

### Authentic refresh & GFX — default on-air preset

Fresh installs (and any `rwc-config.json` **without** overriding `gfx` / `authenticRefresh`) now ship with the **broadcast RDS-style** look:

- **Authentic refresh** on: **100** chars/sec, **120** ms clear hold, **12** ms jitter cap (blank clear), grapheme stream, reduced-motion respected.
- **Next-gen visual layers** on; **SD** logical resolution, **4:3** frame.
- **Retro**: **reload line 100** ms, **VHS analog** layer on, **scanlines ~7%**, **vignette 0.12**, **colour preset none**.

Existing configs on disk are **unchanged** until you save from the Graphics tab or edit JSON. **Crawler** updates via **`POST /api/v1/config/crawler`** are unaffected.

---

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
