# SPEC — LTCE backfill for almanac daily temperature records

## Background

MSC **citypage weather** XML **removed the `<almanac>` block** (daily normals/extremes and related fields) effective **2024-06-25** (announced on `dd_info`). The channel still renders an **Almanac** screen that expects **record high / record low** (with years) for the **local calendar day** of the current observation.

## Goal

Restore **calendar-day record maximum and minimum temperatures** (and years) for the primary citypage location by reading **Long Term Climate Extremes (LTCE) — Temperature** from MSC’s **OGC API — Features**, without reintroducing dependence on removed citypage elements.

## Source of truth

- **Collection:** `https://api.weather.gc.ca/collections/ltce-temperature/items`
- **Query:** `VIRTUAL_CLIMATE_ID={id}&LOCAL_MONTH={m}&LOCAL_DAY={d}&f=csv&limit=5`
- **Semantics (almanac mapping):**
  - **Record high** ← `RECORD_HIGH_MAX_TEMP` + `RECORD_HIGH_MAX_TEMP_YR`
  - **Record low** ← `RECORD_LOW_MIN_TEMP` + `RECORD_LOW_MIN_TEMP_YR`
- **Virtual station list:** `https://api.weather.gc.ca/collections/ltce-stations/items?f=csv` (operators locate `VIRTUAL_CLIMATE_ID` for their city; “Winnipeg Area” = `VSMB38V`).

References: [MSC LTCE readme](https://eccc-msc.github.io/open-data/msc-data/climate_ltce/readme_climateltce_en/), [Open Government LTCE dataset](https://open.canada.ca/data/en/dataset/e2233308-040e-47da-8c9d-2551ff99f810).

## Configuration

- **`misc.ltceVirtualClimateId`** (optional string): MSC **virtual climate identifier** (e.g. `VSMB38V`). When **set**, after each successful citypage parse the server may fetch LTCE for the **station-local** month/day (from `observedDateTime` + `stationOffsetMinutesFromLocal`) and fill **only missing** `extremeMax` / `extremeMin` on the in-memory almanac.
- **Default for bundled Winnipeg primary site:** `VSMB38V` so default `cfg` behaviour matches “Winnipeg Area” LTCE threading.
- **Clearing:** empty string in JSON or config UI clears the field (`undefined`).

## Precedence

1. Citypage / regional / raw XML (if MSC ever restores fragments).
2. **LTCE** fills gaps where `extremeMax` and/or `extremeMin` are still null.
3. **`misc.alternateRecordsSource`** JSON (existing) may **override** highs/lows after LTCE.

## Caching and reliability

- **In-process cache** keyed by `{VIRTUAL_CLIMATE_ID}|{month}|{day}` with **TTL 1 hour** to avoid hammering `api.weather.gc.ca` on frequent citypage pushes.
- **HTTP failures:** log at warn throttle; do not clear existing almanac fields.
- **Tests:** no network; module accepts injected fetch or uses `axios` mock / fixture CSV.

## Non-goals (this tranche)

- Auto-resolving `VIRTUAL_CLIMATE_ID` from `siteList` / citypage code (future enhancement).
- LTCE precipitation / snowfall collections.
- Changing climate-normals (`climateNormals`) or historical bulk (`historicalDataStationID`) pipelines.

## Acceptance

- With `ltceVirtualClimateId: "VSMB38V"` and a stubbed CSV row for a known date, `initializeCurrentConditions` path (or unit-tested parser) yields non-null `extremeMax` / `extremeMin` matching CSV values.
- With field unset/empty, behaviour matches pre-LTCE (no extra HTTP).
- Config POST `/config/misc` persists `ltceVirtualClimateId` alongside existing misc fields.
