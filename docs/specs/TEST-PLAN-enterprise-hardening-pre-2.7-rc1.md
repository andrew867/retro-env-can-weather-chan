# TEST-PLAN — Enterprise hardening (pre **2.7.0-rc1**)

**Paired SPEC:** [SPEC-enterprise-hardening-pre-2.7-rc1.md](./SPEC-enterprise-hardening-pre-2.7-rc1.md)  
**Execution PLAN:** [PLAN-enterprise-hardening-pre-2.7-rc1.md](./PLAN-enterprise-hardening-pre-2.7-rc1.md)

---

## 1. Objectives

1. Prove **no crash / no blank plate** under partial and full payloads for core screens.  
2. Lock **regressions** for flash, apostrophe titles, empty forecast bodies, and climate/AQHI log noise.  
3. Provide **repeatable** assets for **Winnipeg, Oakville, Hamilton, St. John’s**.

---

## 2. Test levels

| Level | Tooling | When |
|-------|---------|------|
| **Unit** | Jest (`yarn test`) | Every PR; required for rc1. |
| **Component / RTL** | `@testing-library/react` | City title, stats line length, forecast edge cases. |
| **Playwright** | `yarn test:e2e` / targeted specs | Raster flash, forecast plate, optional `?e2e*` modes. |
| **Smoke** | `yarn smoke` against running API | Post-deploy; `BASE_URL` + optional tokens. |
| **Manual** | Operator checklist | MSC live data, AMQP down, Datamart-first. |

---

## 3. Fixture strategy (quad cities)

### 3.1 Minimum artifact set (recommended)

| Station | Artifacts |
|---------|-----------|
| **Winnipeg** | Add `s0000193_*` fixtures mirroring the existing `s0000458_*` (Toronto) pattern: observed JSON/XML under `ecccData/conditions/` plus historical/normals stubs so CI does not rely on live MSC. |
| **Oakville** | New `conditions/s0000367_*.json` (+ XML source if round-trip tests need raw); include `regionalNormals` branch for normal fill. |
| **Hamilton** | `s0000549` citypage sample; climate normals `6153194` CSV snippet in unit test for parser + integration. |
| **St. John’s** | `NL/s0000280` citypage sample with city name **exactly** `St. John's` (or MSC canonical); snapshot test for **title line** grapheme integrity. |

### 3.2 Naming & location

- Prefer `src/__tests__/testdata/ecccData/conditions/<site>_e.json` alongside existing Toronto/Winnipeg patterns.  
- National hook tests: extend `nationalWeather.json` slices if testing East list St. John’s row.  
- Playwright: optional `playwright/fixtures/quadCityStation.ts` exporting four `WeatherStation` shapes for visual specs.

---

## 4. Matrix (must pass before rc1)

### 4.1 Server / API

| # | Case | Assert |
|---|------|--------|
| A1 | Citypage 200, malformed XML | No throw; `conditionsFetch` logs short error; previous LKG or empty observed handled. |
| A2 | Historical 200, HTML error page | `looksLikeClimatedataXml` path; warn once; no unbounded retry loop. |
| A3 | Climate normals empty CSV | `Climate normals CSV contained no usable rows` at most once per fetch cycle. |
| A4 | AQHI 404 both mirrors | Warn line contains status + URL; **no** full `AxiosError` object in logs. |
| A5 | `/ready` when citypage stale | 503 + `reason`; `/health` still 200 with `degraded` flags. |

### 4.2 Display

| # | Case | Assert |
|---|------|--------|
| D1 | `conditions === null` then full | No React error; `#conditions` repopulates. |
| D2 | `forecastBodies: []` | Forecast rotator step completes; no stuck `setInterval`. |
| D3 | API restart (`configVersion` new, same `observationID`) | No prolonged blue/red flash (Playwright pixel diff or timer count cap — PLAN defines metric). |
| D4 | **St. John’s** title | Visual or RTL: apostrophe + **s** visible OR deliberate abbreviated form without dangling `'` (product decision recorded in SPEC §5.1). |
| D5 | Stats screen | All `#stats_screen > div` lines ≤ `STATS_SCREEN_MAX_CHARACTERS_PER_LINE` (existing Jest). |

### 4.3 Quad-city smoke (manual or scripted)

| City | Primary `location` | Checklist |
|------|-------------------|-----------|
| Winnipeg | `s0000193` (default `location`; confirm vs `siteList`) | Observed + forecast + almanac + stats + last month numbers non-N/A when IDs configured. |
| Oakville | `s0000367` | Same; verify climate normals ID from inventory that returns **non-empty** pygeoapi CSV. |
| Hamilton | `s0000549` | Same; normals `6153194` / historical MSC ID pair from same inventory row. |
| St. John’s | `s0000280` | Same + **title** + national row spelling. |

---

## 5. Subsystem coverage matrix (maps to SPEC §6)

Every block below MUST have **≥1** automated test **or** a **manual sign-off row** in **§8** before **2.7.0-rc1**.

### 5.1 Backend API routes (`src/routes/index.ts`)

| # | Route group | Cases |
|---|-------------|-------|
| S1 | **`/init`** | Full JSON; malformed `cfg` does not crash server; `init/stream` reconnect. |
| S2 | **`/weather/*`** | Each sub-router: observed, forecast, live, almanac, national, province, usa, airport-metar, sunspots, hot-cold, alerts — 200 + stable schema; upstream 502 returns JSON error body. |
| S3 | **`/config/*`** | Round-trip each POST the UI uses; invalid body 400/422 behaviour. |
| S4 | **`/season`**, **`/flavour`**, **`/airquality`** | Season math; flavour screen list validation; AQHI null observation. |
| S5 | **`/metrics`**, **`/status`**, **`/health`**, **`/ready`** | Auth paths; `statusSchemaVersion`; ready 503 when stale. |

### 5.2 Operator config UI (`display/dist/config.tsx` + `config/*`)

| # | Tab | Cases |
|---|-----|-------|
| C1 | Display | Save `misc`, playlist, alternate records, log level; error toast on API failure. |
| C2 | Graphics | Slider + booleans; `init_refresh` observed in network tab or E2E. |
| C3 | Weather / province / historical / climate / AQHI | Search modals empty + populated; invalid station IDs show operator-safe errors. |
| C4 | Crawler / flavours | Max length; unknown screen id warning. |

### 5.3 Status dashboard (`display/dist/status.tsx`)

| # | Case |
|---|------|
| T1 | Load without token / with token; refresh **each** `STATUS_REFRESH_TARGET`; table matches `buildSnapshot` keys. |
| T2 | `feeds.sunspots` composite timestamp; `feeds.aqhi` note when observation empty. |

### 5.4 Main channel (`channel.tsx` + `screenrotator` + screens)

| # | Case |
|---|------|
| M1 | Full flavour rotation one cycle with **quad-city** fixture intercept (no MSC). |
| M2 | SSE drop → reconnect → `refetchAllFeedsForFreshness` (assert network or log). |
| M3 | Each screen component mounts with **minimal** `WeatherStation` stub (no throw). |
| M4 | GFX: `?e2eVhsTear=1`, `?e2eAirportMetar=1` smoke paths still pass. |

### 5.5 Hooks (`src/hooks/*`)

| # | Hook | Case |
|---|------|------|
| H1 | `useWeatherEventStream` | Message merge ordering; duplicate observation IDs. |
| H2 | `useConfig` / `init` | `initAttempted` false → true; refetch on focus optional. |
| H3 | Polling hooks (`national`, `province`, `usa`, `airportMetar`, `sunspots`, `alerts`, `airQuality`, `hotColdSpots`) | Abort/cleanup on unmount (no setState after unmount warnings). |
| H4 | `useSeason` / `useLastMonth` | Auxiliary event bus refresh updates footer-related data. |

### 5.6 Client transport & metrics

| # | Case |
|---|------|
| X1 | Display `axios` base URL same-origin; metrics POST interval backoff on 401. |
| X2 | `RWC_STRUCTURED_UPSTREAM_LOG` off does not break requests. |

---

## 6. Regression list (bugs explicitly in tranche)

| ID | Symptom | Test idea |
|----|---------|-----------|
| B-001 | St. John’s **`'`** / **`’s`** clipped on forecast conditions line | RTL: render `Conditions` with `city="St. John's"`; assert text content / snapshot; Playwright on forecast screen. |
| B-002 | Almanac Records N/A with valid XML | Fixture citypage XML with extremes only in raw string; assert merged extremes (server unit or integration). |
| B-003 | Toronto-style normals `NORMAL_CODE` C dropped | CSV fixture; assert map non-empty for NORMAL_ID 1 (existing `climateNormals.test.ts` patterns). |
| B-004 | AQHI log spam on 404 | Logger mock or stderr capture in test if feasible; else manual checklist. |

---

## 7. CI gates

- `yarn typecheck`  
- `yarn test` (full unit)  
- `yarn gate:rc` (per OPERATORS)  
- `yarn gate:rc:e2e` before tagging **2.7.0-rc1** (or project policy).  

---

## 8. Manual sign-off (SPEC §6 completion)

Use when no automated test exists yet. Duplicate table in runbook or ticket tracker.

| SPEC §6 Req | Verified by | Date | Evidence (PR / ticket / screenshot) |
|-------------|-------------|------|--------------------------------------|
| *Full R-6 matrix* | | | See [COVERAGE-enterprise-hardening-pre-2.7-rc1.md](./COVERAGE-enterprise-hardening-pre-2.7-rc1.md) for Req → automated test / §8 gap list. |
| *(add manual-only rows below)* | | | |

---

## 9. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering | | | |
| QA | | | |
