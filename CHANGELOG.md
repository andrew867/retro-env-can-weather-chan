# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.7.0-rc5] - 2026-04-09

**2.7.0** release candidate **rc5** — MSC **dynamic** location feeds: `POST /config/locationFeedSuggestions` previews nearest **climate-stations**, **ltce-stations**, **aqhi-stations**, and **swob-stations** (METAR ICAO) from citypage coordinates; `POST /config/locationQuickSetup` accepts opt-in flags for the same; `POST /config/airportMetarStations` saves the METAR list. Locations hub UI adds MSC automation checkboxes, METAR heuristic, preview, and an airport METAR editor. Docs: [SPEC](./docs/specs/SPEC-location-feed-automation-rc5.md), [PLAN](./docs/specs/PLAN-location-feed-automation-rc5.md), [TEST-PLAN](./docs/specs/TEST-PLAN-location-feed-automation-rc5.md).

### Config

- **Locations hub:** **Preview MSC suggestions** and **quick setup** use a **180s** display axios timeout (was the default **25s**) so multi-step MSC datamart + OGC resolution can complete; clearer toast when the client still aborts.

### Display

- **`#rwc-screen-body`:** small **horizontal + bottom** inset (`padding: 0 2px 8px`) so rotator text is less likely to lose a subpixel row to **`overflow: hidden`** on any screen (same paint class as **`#stats_screen`** tuning).
- **Sunspot screen:** MSC **F10.7** flux and NOAA **SWPC** each use a **full-width** framed plate (stacked vertically when both are present) so cycle copy is not squeezed into a half-column; **SWPC** monthly lines stay split for readability and the **NOAA** title can wrap on two lines. **`#sunspots_screen`** uses **`min-height: 0`**, **`max-height: 100%`**, slightly tighter vertical rhythm, and a hidden scrollbar **`overflow-y: auto`** fallback so the tropical outlook table is not clipped at the bottom. **NWS tropical** block uses a **CSS grid** table (city / conditions / hi‑lo) instead of padded monospace columns, with `white-space: normal` / `pre-wrap` so glyphs are not clipped under channel `overflow`.
- **Province tracking (24h precip):** **`formatProvinceYesterdayPrecipDisplay`** encodes MSC rules (**NIL** for sub-threshold amounts including zero and for literal **NIL**; **MISSING** for **N/A**, **M**, empty, null; **TRACE** only for an explicit trace token). Citypage parsing no longer maps **N/A** or trace to `{ amount: 0 }`, drops the “assume 0 mm when yesterday exists but unresolved” fallback, and can persist **`"TRACE"`** / **`"NIL"`** when the feed is explicit.

## [2.7.0-rc4] - 2026-04-09

**2.7.0** release candidate **rc4** — single **Locations & feeds** config tab with **quick setup** (primary station search → `POST /api/v1/config/locationQuickSetup`) plus existing per-feed editors; optional **ON / MB** province-tracking presets. LTCE virtual station search and **Save LTCE** moved here from Display. Docs: [SPEC](./docs/specs/SPEC-config-location-hub-rc4.md), [PLAN](./docs/specs/PLAN-config-location-hub-rc4.md), [TEST-PLAN](./docs/specs/TEST-PLAN-config-location-hub-rc4.md). Playwright baselines refreshed for config and canonical/forecast visuals.

## [2.7.0-rc3] - 2026-04-11

**2.7.0** release candidate **rc3** — display and parsing hardening so malformed MSC payloads, missing strings, or non-finite clock offsets cannot take down the rotator (Hamilton-style prod incidents).

### Display / copy

- **Sunspot plate (`#sunspots_screen`):** Sub-plate titles name the data: **MSC/DRAO** block uses **`F10.7 CM FLUX (SFU)`** (international **F10.7** index and **SFU** unit); **NOAA SWPC** block uses **`NOAA SWPC CYCLE (ISN + F10.7)`** (international sunspot context plus the **F10.7** cycle index); the warm-city outlook adds **`NWS TROPICAL SUNSPOT WX`** above the station table. **`SunspotScreen`** hook order fixed so **`sunspotDate`** is not computed after conditional returns.

### Reliability / display

- **AQHI warning (`Screens.AQHI_WARNING`):** Safe headline when **`city`** is missing; **`airQuality`** may be **`null`** from the poller; require a **finite** index value for dwell/render; correct **12-hour → 24-hour** mapping for **12 AM / 12 PM**; fallback label when the MSC observation stamp is incomplete.
- **Weather station stats (`#stats_screen`):** **`addMinutes`** no longer receives **`NaN`** (guards **`stationOffsetMinutesFromLocal`**, safe **`parseISO`** inputs, **`Math.max(0, …)`** for precip dot padding). **`city`** may be null/blank without **`trim`** crashes; whitespace-only city skips the plate.
- **Footer bar clock:** **`timeOffset`** from **`stationOffsetMinutesFromLocal ?? 0`** still passes **`NaN`** through ( **`??`** only replaces **`null` / `undefined`** ); the ticker now clamps to a **finite** minute offset so **`date-fns` `addMinutes`** cannot throw.
- **Last month stats:** Formatters treat **`null` / non-finite** numbers as **“N/A”** instead of calling **`.toFixed`** on **`null`**; optional **`city`** with safe trim.
- **Province tracking grid:** Non-finite **`displayTemp`** shows **“N/A”** instead of **`NaN`** in the temperature column.
- **Citypage → station time (`conditions.generateWeatherStationTimeData`):** Requires **`textSummary`**, validates the parsed observation instant, parses **`UTCOffset`** defensively, and stores **`stationOffsetMinutesFromLocal === 0`** when the offset is not finite (avoids **`addMinutes`** throws across **`adjustObservedDateTimeToStationTime`**, **`observedDateTimeAtStation`**, **`stationWallClockFromStationTime`**, and stats/sun lines).

### Tests

- **`footerBar.test.tsx`**, **`lastMonthScreen.test.tsx`**, **`aqhiWarningScreen.test.tsx`**, stats NaN-offset case, **`displayTime`** NaN-offset case.

## [2.7.0-rc2] - 2026-04-11

**2.7.0** release candidate **rc2**; **package version renumbered from 2.6.8** so npm, OpenAPI, and the public mirror follow the **2.7.0** RC line (entries below are the same scope as the former **2.6.8** patch).

### Config / flavours

- **New flavour templates:** **On-air cable (14s)** — same playlist as the original shipped default (`FLAVOUR_DEFAULT`); **All screens (2s)** — every `Screens` id once at minimum dwell for fast previews. **Delete** — `DELETE /api/v1/flavour/{name}` removes `cfg/flavours/{name}.json`, refreshes the flavours list, and if that flavour was active, persists look-and-feel **`default`** in `rwc-config.json`. Config UI: two green template buttons, **Delete this flavour** with confirm.
- **Minimum dwell:** flavour timing floor remains **2s** per step (`SCREEN_MIN_DISPLAY_LENGTH`).
- **Flavours tab:** Screen type `<Select>` uses **string** `value`s so Chakra shows the chosen row when a template pre-fills numeric `screen.id`s (same pattern as native `<select>` / React controlled components).

### Display / ops

- **LTCE virtual station search** on the Display tab (`POST /config/ltce-stations`) to fill `misc.ltceVirtualClimateId` (MSC LTCE almanac backfill).
- **Weather station statistics (`#stats_screen`):** Title is **`{city} statistics - {date}`** on **one** line (was two), so typical plates like **Winnipeg** lose a row and the last block is less likely to clip on fixed-height rotations.

### CI / GitHub

- **Tag → Release:** Pushing a tag matching **`v*`** (e.g. **`v2.7.0-rc2`**) runs **`.github/workflows/release-on-tag.yml`**, which checks **`package.json`** matches the tag, builds rich release notes from **`CHANGELOG.md`** via **`scripts/github-release-notes.mjs`**, and publishes a **GitHub Release** (prerelease when the tag contains **`rc`**, **`beta`**, or **`alpha`**).

## [2.7.0-rc1] - unreleased

### Enterprise hardening (pre-rc1 tranche)

- **Specs:** [SPEC-enterprise-hardening-pre-2.7-rc1.md](./docs/specs/SPEC-enterprise-hardening-pre-2.7-rc1.md), [TEST-PLAN](./docs/specs/TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md), [PLAN](./docs/specs/PLAN-enterprise-hardening-pre-2.7-rc1.md), [coverage map](./docs/specs/COVERAGE-enterprise-hardening-pre-2.7-rc1.md), [quad-city climate appendix](./docs/specs/APPENDIX-quad-city-climate-ids.md).
- **Display — place names:** Conditions / last month / stats use the **full** MSC `city` string (no truncation). Regional **on-air** strings (“southern manitoba”, “southern ontario”, AQHI **WPG/YHM/YYT**) live in **`lib/display/plugins/bundles/ecccRetroBroadcast.bundle.ts`** (configurable ID arrays + rules) and resolve through **`lib/display/plugins/displayLabelRegistry.ts`** — core screens import **`outlookRegionalLabel`** only. `#conditions` sets **`data-rwc-label-template`** for bundle-specific SCSS without core `if` chains.
- **Outlook:** Single rotator plate (no pagination split); flavour helper text updated.
- **Last month stats:** Flavour option to show **all month** vs **days 1–5** only (ECCC-style default); `filterFlavourScreensForPlayout` in `ScreenRotator`.
- **Status snapshot:** `historical` and `climate_normals` blocks may include a **`note`** when bulk data is empty or CSV parse yields no rows (operator steer to appendix).
- **Logging:** `warnThrottled` reduces duplicate climate / historical operator warns during fetch storms.
- **CI fixtures:** Quad-city observed JSON under `src/__tests__/testdata/ecccData/conditions/` + `channelQuadCitySmoke.test.ts`.
- **Almanac record high/low (LTCE):** MSC removed citypage `<almanac>` in 2024; the server now backfills **calendar-day record max/min** from **`api.weather.gc.ca/collections/ltce-temperature`** when **`misc.ltceVirtualClimateId`** is set (default **`VSMB38V`** for Winnipeg Area). **`misc.alternateRecordsSource`** JSON still overrides after LTCE. Docs: [SPEC](./docs/specs/SPEC-ltce-almanac-records.md), [PLAN](./docs/specs/PLAN-ltce-almanac-records.md), [TEST-PLAN](./docs/specs/TEST-PLAN-ltce-almanac-records.md). Implementation: `lib/eccc/ltceDailyTemperatureRecords.ts`, `conditions.mergeExternalAlmanacRecordSources`, Display config field.

## [2.6.7] - 2026-04-10

### Documentation & API

- **`docs/api/`** — API index ([README.md](./docs/api/README.md)), **[OpenAPI 3.0](./docs/api/openapi.yaml)** for Postman/codegen, and **[REST-COOKBOOK.md](./docs/api/REST-COOKBOOK.md)** with curl examples for automation (crawler, GFX, flavours, status refresh).
- **`docs/README.md`** — Documentation table of contents.
- **[OPERATORS.md](./OPERATORS.md)** — Datamart publication-lag env vars (`RWC_DATAMART_HOURLY_DIR_*`), **deployment / network exposure** (unauthenticated config writes, bind address), **release candidate checklist**, expanded HTTP endpoint table (`/config`, `/flavour`, `/season`, `/airquality`).
- **[docs/specs/PLAN-release-hardening.md](./docs/specs/PLAN-release-hardening.md)** — Phase 2.4 smoke scope + new **2.5 API docs** row; Phase 1.3 notes Datamart hourly retries.

### Tooling

- **`yarn gate:rc`** — `yarn typecheck && yarn test`.
- **`yarn gate:rc:e2e`** — `yarn gate:rc && yarn test:e2e`.
- **`yarn smoke`** — Extended `scripts/post-deploy-smoke.mjs`: **`GET /init`**, **`GET /metrics`** (accepts 200 / 401 / 404), **`GET /status`** (200 / 401 / 404). Optional **`METRICS_TOKEN`** env when the server uses **`RWC_METRICS_TOKEN`**.

### Reliability

- **Datamart hourly directory:** For the **current UTC hour** only, retry when the HTML listing contains **no matching citypage files** yet (same delayed retry pattern as failed GETs), controlled by **`RWC_DATAMART_HOURLY_DIR_*`**.
- **MSC / NWS HTTP log hygiene:** Datamart hourly listing failures, national citypage fetches, and province-tracking fetches log **short** lines via **`formatFetchError`** instead of dumping full **`AxiosError`** objects.
- **Airport METAR / AWC / NWS:** AWC batch failures also use **`formatFetchError`**. **`fetchAwcMetarRows`** tries **`https://www.aviationweather.gov/...`** when the bare **`aviationweather.gov`** host fails with **DNS / network** errors (no HTTP response). If the batch still fails, the airport METAR poller falls back to **NWS** **`api.weather.gov/.../observations/latest`** per ICAO (same **`User-Agent`** policy as other NWS calls). USA weather reuses shared **`fetchNwsLatestObservation`** and **`formatFetchError`** for NWS + AWC paths.

### Config

- **Airport METAR:** `MAX_AIRPORT_METAR_STATIONS` is **7** (fits the plate without clipping the last row); **`DEFAULT_AIRPORT_METAR_STATIONS`** is Winnipeg, St. John's (**CYYT**), Vancouver, Toronto, Montreal, Calgary, New York (**KJFK**) — Chicago (**KORD**) dropped from defaults. Omit **`airportMetarStations`**, set it to **`[]`**, or supply only invalid rows, and the channel **falls back to that default list** so the METAR screen and poller never sit on an empty station list. The display client and **`GET /weather/airport-metar`** coerce non-array payloads; METAR rows tolerate missing temperature in the UI.
- **Logging levels:** Console output is now level-gated with `debug|notice|warn|error|critical`; default is **`warn`** (so debug/notice are muted). Set `misc.logLevel` in `rwc-config.json` (or env `RWC_LOG_LEVEL`) to change verbosity.

### Display / national data

- **Screen rotator after API restart:** Removed **`configVersion`** from the rotator effect that calls **`prepareSwitchToNextScreen`**. A new **`configVersion`** UUID on every server process start was firing that effect in the same flush as the playlist-reset effect, while **`conditionsOrConfigUpdated`** was still stale **`false`**, so **`switchBackgroundColour`** ran repeatedly and the raster flashed **blue/red** until the display tab was reloaded.
- **Conditions in Ontario:** New screen **`CANADA_TEMP_CONDITIONS_ON`** (same regional list layout as Manitoba). The national JSON API includes an **`on`** array; default flavour runs Ontario after Manitoba.
- **East / West Canada lists:** Primaries are **seven cities** each — **East:** Toronto, Ottawa, Montreal, Fredericton, Halifax, Charlottetown, St. John’s (Ontario, Quebec, and every Atlantic province; Ontario appears twice). **West:** Vancouver, Calgary, Saskatoon, Brandon, Whitehorse, Yellowknife, Iqaluit (**NU/s0000394**) across BC, AB, SK, MB, YT, NT, NU. Backups unchanged in role (fill when primaries do not report).
- **VHS head-switch tear (bottom band):** Stronger **overlay** blend (vs soft-light), taller band, and **diagonal** streak layer so the effect reads on broadcast blue in browser/OBS. **`?e2eVhsTear=1`** freezes horizontal offset for captures; Playwright **`vhs-head-switch-tear-visual.spec.ts`** clips the bottom strip for regression.
- **Init / Graphics:** Saving **Graphics** now emits SSE **`init_refresh`** on **`/api/v1/init/stream`** so open display tabs refetch **`GET /init` immediately** (previously only crawler updates did; gfx could lag up to **30s**).
- **Vignette vs head-switch tear:** **`gfx-vignette-layer`** now lives **inside** **`.rwc-channel-stack`** with **lower z-order** than grain / scanlines / tear so the bottom **head-switch** band is not covered by the vignette overlay (sibling-after-stack placement had hidden or crushed the effect).
- **Init SSE URL:** Display **`EventSource`** for init uses **`${window.location.origin}/api/v1/init/stream`** so the stream works when the bundle is not served from `/`.
- **Gfx booleans:** **`vhsAnalogLayerEnabled`** / **`vhsHeadSwitchTearEnabled`** are coerced with a small helper so string values from JSON cannot leave the tear stuck off.
- **Head-switch band geometry & strength:** Band height is **one quarter** of the prior build (**3%** frame height, **max 18px** / **min 7px**); gradient streaks are **stronger** so the thinner line still reads on air. New **`gfx.retro.vhsHeadSwitchTearOpacity`** (0–1, default **1**) drives **`--gfx-vhs-tear-opacity`**; **Graphics** config includes a slider (when analog + tear are on).
- **Airport METAR plate:** Rows are one **`pre`** line per station with **NBSP-padded** fixed columns and normal spaces between name / temp / flight category so text does not collapse (a prior flex + `nowrap` rule had removed visible gaps). Space before the first **`·`** keeps **MVFR** aligned with **VFR**. **`?e2eAirportMetar=1`** shows a deterministic fixture without SSE; Playwright **`airport-metar-layout.spec.ts`** and Jest **`airportMetarScreen.test.tsx`** cover layout.
- **24h precip / province tracking:** Name column narrowed from **10** to **8** monospace characters and the temp→precip gap from **3** to **1** space so the grid fits **`#display`** at normal channel font size; **`#province_tracking_screen`** no longer uses **`font-size: 0.8em`** (adds **`overflow-x: hidden`** as a safety valve). Jest **`provinceTrackingScreen.test.tsx`** checks row padding.
- **Weather station statistics (`#stats_screen`):** Full-width monospace lines were slightly wider than the padded display area, so **`#rwc-screen-body`** centering clipped the left/right few pixels of edge glyphs. Uses **`STATS_SCREEN_MAX_CHARACTERS_PER_LINE` (31)** for dot leaders, one fewer leading space on the title, **`#stats_screen`** **`align-self: stretch`** / **`width: 100%`** so the block is not narrower than the display, and **sunrise + sunset on one line** (`Sunrise..h:mma Sunset..h:mmp`, ≤31 `ch`) so the bottom of the plate is not clipped by an extra row. Jest **`statsScreen.test.tsx`** asserts row lengths.
- **Almanac API / last year column:** **`GET /api/v1/weather/almanac`** (and the JSON it returns) now merges **last-year high/low** from the same historical climatedata bulk path as **`GET /weather/observed`**, instead of leaving **`lastYearMin` / `lastYearMax`** null. Citypage **`<almanac><temperature>`** is normalized to an array when MSC returns a single element so **extreme** / **normal** rows parse reliably. When **`misc.alternateRecordsSource`** supplies record highs/lows, applying that data now triggers an auxiliary SSE refresh so the **Records / Year** columns update without waiting for the next citypage push.
- **Almanac record high/low (Records / Year columns):** When **`ec-weather-js`** omits **`extremeMax` / `extremeMin`** from structured citypage JSON, values are **parsed from the raw citypage XML** (`<temperature class="extremeMax|extremeMin">`) after the normal almanac parse. **`retrieveAlmanacTemp`** matches **`class`** case-insensitively.
- **Climate normals (`api.weather.gc.ca` CSV):** Parser accepts **`NORMAL_CODE`** **`A`–`D`** (ECCC quality tiers), not only **`A`**. When multiple rows share the same **`NORMAL_ID` + `MONTH`**, the **best** tier is kept (**A** preferred over **B** over **C** over **D**), so composite stations (e.g. Toronto) that publish **`C`** for temperature normals still populate last-month / season stats.
- **AQHI observation fetch:** **404** / **403** from MSC mirrors log a **short warn** (URL + status); other failures use **`formatFetchError`** instead of **`logger.error`** with a full **`AxiosError`** dump.
- **Sunspot screen + 10.7 cm solar flux + NOAA SWPC cycle:** **`GET /weather/sunspots`** returns **`{ observations, solarFlux, solarCycleSwpc }`**. **`solarFlux`** is parsed from Natural Resources Canada’s [daily `fluxtable.txt`](https://spaceweather.gc.ca/solar_flux_data/daily_flux_values/fluxtable.txt) (MSC / DRAO), polled about hourly. **`solarCycleSwpc`** merges NOAA SWPC JSON ([observed SSN](https://services.swpc.noaa.gov/json/solar-cycle/swpc_observed_ssn.json), [observed monthly indices](https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json), [predicted cycle](https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json)), polled every **3 hours** (~1 MB combined per refresh). The sunspot plate adds a **NOAA SWPC SOLAR CYCLE** block (daily estimated SSN, last complete monthly means, current-month prediction) under the MSC flux lines when any slice is present; the screen can show from **flux**, **SWPC**, and/or **tropical** rows alone. Status **sunspots** refresh runs **NWS outlook**, **MSC flux**, and **SWPC** pollers. *SILSO/WDC* files ([SIDC datafiles](https://www.sidc.be/SILSO/datafiles)) are **CC BY-NC** and were not wired here; use NOAA for this plate unless you add attribution and policy review. (The [CHAIN /data](https://www.chain-project.net/data/) tree is GNSS/ionosonde-oriented, not F10.7; integrate only if a concrete product URL + format is chosen.)

### Operator status dashboard

- **Alerts row (Details):** Shows **active** CAP count, **MSC AMQP CAP notifications received** since process start, and **last Rx** (local wall time). Snapshot adds **`capAmqpReceived`**, **`capAmqpLastRxAt`**; **`statusSchemaVersion`** is **2**.
- **Status page auth cleanup:** Request interceptor teardown uses **`axios.interceptors.request.eject`** (Axios 1.x).

### Tooling & TypeScript

- **`yarn typecheck`** runs **`tsc --noEmit`** (full project typecheck). **`yarn start`** uses **`tsx`** and does **not** type-check; **`yarn dev`** uses **`ts-node-dev`** and does—CI and local **`typecheck`** catch drift.
- **GitHub Actions:** **`typecheck`** job runs after dependency install; **`unit-test`** waits on **eslint** and **typecheck**.
- **Axios config:** Shared **`RwcAxiosRequestConfig`** (**`types/rwcAxiosConfig.ts`**) carries optional **`rwcUpstream`** metadata for MSC mirror / retry helpers without fragile declaration merging under **`ts-node-dev`**.
- **National module:** Service class renamed **`NationalWeatherAggregator`** to avoid shadowing the **`NationalWeather`** payload type from **`types`**.
- **Metrics attach:** **`attachBackendAxiosMetrics`** / **`attachDisplayAxiosMetrics`** take **`AxiosInstance`** (not **`AxiosStatic`**).
- **AMQP typings:** Minimal **`Connection`** shape, **`listen()`** declaration for **`sarra-canada-amqp.js`**, and **`amqp`** module stubs for tests.
- **XML / JSON guards:** MSC **`axios` `data`** narrowed to **string** before **`xml2js`** (citypage site list, AQHI list/observation, CAP body, provincial hot/cold); NWS latest observation response typed for **`properties`**.
- **Display bundle:** Type-only **`CrawlerMessages`** import; explicit **`null`** returns on small layout helpers; **`coerceArray<T>`** at national / airport METAR / province / sunspots; visibility formatting tolerates **`unknown`** unit values from merged payloads.
- **Tests / fixtures:** Playwright weather fixtures use **`units`** on ECCC **`{ value, units }`** blobs; AWC line test includes **`icaoId`**; **`fetchMeta`** doubles **`unknown`**; playlist test uses **`ChannelPlaylistContext`**.

---

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

**Config (`cfg/rwc-config.json`):** array **`airportMetarStations`** — up to **7** entries: `{ "name": "Winnipeg", "code": "CYWG" }`. ICAO codes are normalized to uppercase; invalid entries are dropped. Default list includes Canadian hubs (e.g. **CYWG**, **CYYT**, **CYVR**, **CYYZ**, **CYUL**, **CYYC**) plus **KJFK**.

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
