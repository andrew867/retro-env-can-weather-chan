# SPEC — Enterprise hardening & display reliability (pre **2.7.0-rc1**)

**Status:** Draft for final bug-review tranche  
**Audience:** Engineering, ops, QA  
**Related:** [TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md](./TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md), [PLAN-enterprise-hardening-pre-2.7-rc1.md](./PLAN-enterprise-hardening-pre-2.7-rc1.md), [INVENTORY-feeds.md](./INVENTORY-feeds.md), [POLL-vs-PUSH-matrix.md](./POLL-vs-PUSH-matrix.md)

---

## 1. Purpose

Define **acceptance criteria** for a coordinated pass over **data loading**, **caching / staleness**, and **display resilience** so that broadcast-style operation does not exhibit:

- process crashes or unhandled render errors;
- prolonged **blank** `#display` / `#conditions` / full-screen plates;
- spurious **blue/red** raster flashes unrelated to intentional screen transitions;
- chronic **N/A** or empty columns where MSC publishes data under supported configs;
- **clipped** or **mangled** copy for real Canadian place names (Unicode, apostrophes, abbreviations).

This SPEC is the **contract** for what “ready for **2.7.0-rc1**” means for this tranche. Implementation details live in the PLAN; verification lives in the TEST-PLAN.

---

## 2. Scope

### In scope (summary)

Every **ship surface** below MUST appear in **§6 (master checklist)** with acceptance notes; gaps are tracked as PLAN work until closed.

| Layer | Topics |
|-------|--------|
| **Server / API** | All `src/routes/*` mounts under `/api/v1`: `init`, `health`/`healthz`, `ready`, `metrics`, `status`, `weather`, `config`, `season`, `flavour`, `airquality`; matching `lib/eccc/*`, `lib/national/*`, `lib/provincetracking/*`, `lib/usaweather/*`, `lib/airportMetar/*`, `lib/sunspots/*`, `lib/solar*`, `lib/cap*`, `lib/reliability/*`, `lib/storage`, `lib/health/*`, `lib/status/*`, `lib/config/*`, `server.ts` bootstrap. |
| **Transport & hooks** | `EventSource` / axios clients: `useWeatherEventStream`, `useConfig` + `init/stream`, `usePollingFetch`, and every hook in `src/hooks/` (`national`, `provinceTracking`, `season`, `usa`, `airportMetar`, `sunspots`, `alerts`, `airQuality`, `lastMonth`, `hotColdSpots`, `saveConfigOption`). |
| **Operator config UI** | Parcel bundle `display/dist/config.tsx` + **all** tabs under `display/components/config/*` (display, gfx, weather station + search modals, province grid, historical ID, climate normals, AQHI + station search, crawler, flavours, air quality copy). |
| **Status dashboard UI** | `display/dist/status.tsx` — feed table, refresh actions, auth token UX, links to docs. |
| **Main channel UI** | `display/dist/channel.tsx`, `ScreenRotator`, **every** screen in `display/components/screens/*`, `Conditions`, `CrawlerMessages`, `FooterBar`, `PlaylistComponent`, **GFX** (`GfxRetroApply`, scanlines, VHS grain/tear, vignette, `NextGenGfxLayer`, `FontModeApply`). |
| **Persistence & security posture** | `cfg/` JSON read/write, `misc` knobs (`logLevel`, `alternateRecordsSource`, `rejectInHourConditionUpdates`), unauthenticated config writes (document + network guidance per OPERATORS). |
| **Test assets** | Deterministic fixtures for **Winnipeg**, **Oakville**, **Hamilton**, **St. John’s** (see §5). |

### Out of scope (this tranche)

- Replacing `ec-weather-js` or MSC AMQP stack entirely.
- Load / soak testing beyond what CI + Playwright already run.
- New product features (new screens, new feeds) unless required to meet §3.

---

## 3. Definitions

- **Primary citypage:** XML for `primaryLocation` — source of truth for conditions, forecast, almanac envelope, rise/set.
- **Auxiliary feeds:** Everything in [INVENTORY-feeds.md](./INVENTORY-feeds.md) except primary citypage.
- **LKG:** Last-known-good merge for auxiliary lists when upstream fails but cached snapshot is within `RWC_LKG_MAX_AGE_MS`.
- **Blank screen:** `#rwc-screen-body` renders no visible plate content for a full dwell interval while the process is healthy (not user tab background).
- **Flash:** rapid alternating `SCREEN_BACKGROUND_BLUE` / `RED` on `#display` outside normal rotator cadence.

---

## 4. Functional requirements

### 4.1 Data availability

- **R-4.1.1** After a successful citypage parse, `GET /api/v1/weather/observed` MUST return non-null `observed` and `forecast` arrays with at least one entry when MSC provides them for that station.
- **R-4.1.2** Historical bulk (`historicalDataStationID`) and climate normals (`climateNormals.climateID`) MUST either populate derived fields (last year, normals, season precip) OR surface a **single** actionable log line (no duplicate spam) when ECCC returns empty/unparseable bodies.
- **R-4.1.3** When `climateNormals` Climate ID is **absent** from `api.weather.gc.ca` (empty CSV), operator docs or status note MUST steer to a known-good ID (same tranche as PLAN **Tranche B**).
- **R-4.1.4** AQHI: missing file (404) MUST NOT produce multi-kilobyte error dumps; observation may be empty until `airQualityStation` is corrected.

### 4.2 Caching & staleness

- **R-4.2.1** Footer / headers MUST continue to use `X-RWC-Data-Fetched-At` semantics from `getDataFetchedAtForHeader()` including LKG (no “fresh” label on stale auxiliary data).
- **R-4.2.2** SSE reconnect path MUST refetch polled feeds (`refetchAllFeedsForFreshness` pattern) so a blank merge window is bounded (target: &lt; one rotator step where feasible).
- **R-4.2.3** `/ready` MUST remain consistent with citypage stale policy (`RWC_CITYPAGE_STALE_FALLBACK_*`).

### 4.3 Display & UX

- **R-4.3.1** `Conditions` MUST NOT throw when partial `observed` objects arrive (existing `unitValue` pattern); null `conditions` MAY render empty `#conditions` but MUST recover on next payload without remount crash.
- **R-4.3.2** City / location titles MUST NOT split **apostrophe + possessive** in a way that shows a dangling glyph (see §5.1 — **St. John’s** on forecast / conditions line).
- **R-4.3.3** `ForecastScreen` MUST degrade gracefully when `forecastBodies` is empty (no infinite timers; no stuck reload animation).
- **R-4.3.4** `ScreenRotator` MUST NOT reintroduce `configVersion` into effects that cause blue/red flash loops on API restart (regression lock).
- **R-4.3.5** Authentic refresh: reduced-motion and empty plaintext paths MUST not leave invisible blocking overlays.

### 4.4 Observability

- **R-4.4.1** Upstream failures log **structured** or **short** messages (`formatFetchError`); never log full axios response bodies for routine 404/403.

---

## 5. Canonical stations (fixture & manual QA)

| City | Typical citypage `location` | Notes |
|------|-----------------------------|--------|
| **Winnipeg** | `s0000193` (`DEFAULT_WEATHER_STATION_ID` in `server.consts.ts`; confirm against MSC `siteList`) | Primary dev default; align `historicalDataStationID` / `climateNormals` with same station row in ECCC inventory. |
| **Oakville** | `s0000367` | Halton belt; climate normals ID must exist on pygeoapi (see prior Burlington/Oakville/Hamilton matrix). |
| **Hamilton** | `s0000549` | Strong auxiliary pairing for GTA climate normals (`6153194`). |
| **St. John’s** | `NL/s0000280` | National list + **CYYT** METAR; **Unicode / apostrophe** in name — title truncation MUST be grapheme- or rule-aware (§5.1). |

### 5.1 St. John’s apostrophe bug (historical root — resolved in code)

Earlier builds truncated city with UTF-16 `slice`, which broke **“St. John’s”** on narrow plates. **Current rule:** the channel shows the **full** MSC `city` string everywhere it labels the site (conditions, stats title row, last month, AQHI warning, outlook title fragment), with CSS `overflow-wrap` / `white-space: normal` so long official names remain readable — **no** per-station overrides or abbrev tables.

---

## 6. Master checklist — every product surface (must be reviewed before **2.7.0-rc1**)

Each row: **Surface** → **What to verify** → **Requirement id** (trace to TEST-PLAN **§4** matrix rows, **§5** subsystem blocks **S/C/T/M/H/X**, **§6** regression IDs, **§7** CI, **§8** manual sign-off).

### 6.1 Backend — HTTP API (`src/routes/` + handlers)

| Surface | Verify | Req |
|---------|--------|-----|
| **`GET /init`** (+ stream) | Returns flavour, gfx, crawler, look-and-feel; SSE `init_refresh` after saves; no crash on partial `cfg`. | R-6.1.1 |
| **`GET/POST /weather/*`** | Observed, forecast, live SSE, almanac, national, province, USA, airport METAR, sunspots, hot-cold, alerts — each returns stable JSON shape; errors JSON not HTML. | R-6.1.2 |
| **`GET/POST /config/*`** | Validation warnings only; persistence; `saveConfigOption` parity with UI fields; no silent drop of nested keys. | R-6.1.3 |
| **`GET/POST /season`**, **`/lastmonth`** path if any | Season + last-month payloads match hooks; empty last month does not 500. | R-6.1.4 |
| **`PUT/POST /flavour`** | Screen id validation; invalid flavour does not brick server start (warn path). | R-6.1.5 |
| **`GET /airquality`** | Pass-through observation shape; empty when station unset. | R-6.1.6 |
| **`GET /metrics`**, **`POST /metrics/client`** | Auth when token set; display metrics merge; no PII. | R-6.1.7 |
| **`GET /status`**, **`POST /status/refresh`** | Snapshot schema v2; every `feeds.*` block populated or `none` + optional `note`; refresh scopes match `STATUS_REFRESH_TARGETS`. | R-6.1.8 |
| **`GET /health`**, **`GET /ready`**, **`/healthz`** | Degraded flags, AMQP snapshot, readiness 503 semantics. | R-6.1.9 |

### 6.2 Backend — data modules (`src/lib/**`)

| Surface | Verify | Req |
|---------|--------|-----|
| **Citypage** (`conditions.ts`) | AMQP + datamart + legacy URL order; stale fallback; `applyCitypageHttpResponse` idempotency; almanac merge + raw XML extreme fill; `fillAlmanacNormalsFromRegional`. | R-6.2.1 |
| **Historical / climate normals** | URL templates; parse empty; event `EVENT_BUS_AUXILIARY_WEATHER_DATA_READY`; NORMAL_CODE A–D behaviour. | R-6.2.2 |
| **National / province / USA / METAR / AQHI / sunspots / solar / hot-cold / alerts** | LKG merge, circuit, `formatFetchError`, polling intervals, season gating (sunspots). | R-6.2.3 |
| **Config load** (`config.ts`, `configValidation.ts`) | Invalid airport / screen ids; flavour merge; `configVersion` generation rules. | R-6.2.4 |
| **Storage** (`storage.ts`) | Disk warn; cfg directories exist. | R-6.2.5 |

### 6.3 Operator config UI (`display/components/config/*` + `config.tsx`)

| Tab / area | Verify | Req |
|------------|--------|-----|
| **Display** (`display.tsx`) | `misc`, playlist, reject-in-hour, alternate records URL, log level; save + toast + SSE side effects documented. | R-6.3.1 |
| **Graphics** (`gfx.tsx`) | All `gfx.*` + `authenticRefresh`; booleans coerced; `init_refresh` on save. | R-6.3.2 |
| **Weather station** + **search modals** | Primary location; station search errors; province code. | R-6.3.3 |
| **Province temp/precip** | Grid length; invalid codes. | R-6.3.4 |
| **Historical + climate normals** | Help links; station ID vs climate ID confusion documented in UI copy if needed. | R-6.3.5 |
| **AQHI** + **station search** | `area/code` format; 404 handling does not spam console in **browser** devtools when proxying API errors. | R-6.3.6 |
| **Crawler**, **Flavours** | Line limits; screen id list vs `Screens` enum. | R-6.3.7 |

### 6.4 Status dashboard (`display/dist/status.tsx` + `buildSnapshot.ts`)

| Surface | Verify | Req |
|---------|--------|-----|
| **Table rows** | Every feed in snapshot has meaningful `source` / timestamps; CAP AMQP columns; AQHI note when empty. | R-6.4.1 |
| **Refresh** | Each `STATUS_REFRESH_TARGET` triggers expected server path; errors surfaced in UI not silent. | R-6.4.2 |
| **Auth** | Bearer optional; 401 UX. | R-6.4.3 |

### 6.5 Main channel (`channel.tsx` + screens + chrome)

| Surface | Verify | Req |
|---------|--------|-----|
| **Hooks wiring** | All `use*` hooks receive refetch on SSE reconnect (`refetchAllFeedsForFreshness`). | R-6.5.1 |
| **Screen rotator** | Playlist build; dwell; background colour; `configVersion` / `observationID` dependency correctness. | R-6.5.2 |
| **Screens** | Forecast, outlook, almanac, stats, last month, national (incl. ON/MB lists), province, USA, airport METAR, wind chill, AQHI warning, info, alerts, sunspots — each tolerates null slices / empty arrays. | R-6.5.3 |
| **Crawler + footer** | Crawler messages empty; footer freshness hint vs headers; no overflow clip regression. | R-6.5.4 |
| **Playlist / music** | Empty playlist does not throw. | R-6.5.5 |
| **GFX stack** | Layer order (vignette vs tear); reduced motion paths; `e2e` query fixtures. | R-6.5.6 |

### 6.6 Cross-cutting

| Topic | Verify | Req |
|-------|--------|-----|
| **Logging** | Level gate; upstream structured log toggle. | R-6.6.1 |
| **Client axios** | Display bundle metrics post; interceptors. | R-6.6.2 |
| **Unicode / typography** | Apostrophe cities + French accents in crawler/config if used. | R-6.6.3 |

**Completion rule:** For **2.7.0-rc1**, each **Req** above MUST be either **test-automated** (unit/e2e/smoke) or **signed off manual** with a row in TEST-PLAN **§8**.

---

## 7. Release gate (pre **2.7.0-rc1**)

- [ ] All **P0** items in PLAN closed with tests.
- [ ] **§6 master checklist** — every **Req** row satisfied (automated or signed manual per TEST-PLAN **§8**).
- [ ] TEST-PLAN **§4** (quad-city + server/display matrix) + **§5** (subsystem coverage) + **§7** CI gates green in CI or documented skip with reason; **§8** complete for any remaining Req without automation.
- [ ] No open **P0** display regressions (flash, blank, crash) on default flavour + one “heavy” flavour (max screens + AQHI + METAR).
- [ ] CHANGELOG tranche entry merged under **[2.7.0-rc1]** or **[2.7.0]** prep section.

---

## 8. Document control

| Version | Date | Author |
|---------|------|--------|
| 0.1 | 2026-04-11 | Planning tranche (assistant draft) |
| 0.2 | 2026-04-09 | Master checklist §6 + TEST-PLAN §5–§9 cross-links aligned |
