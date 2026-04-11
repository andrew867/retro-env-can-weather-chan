# SPEC — MSC location feed automation (2.7.0-rc5)

## Goal

Operators can rely on **MSC-backed geometry** (not hand-maintained tables) to:

1. **Backfill climate / bulk / normals / LTCE** when there is **no** curated `citypageClimateAnchors` entry for the chosen citypage code, using `api.weather.gc.ca` **climate-stations** and **ltce-stations** collections with bbox + Haversine distance.
2. Set **AQHI** (`airQualityStation`) from the nearest **aqhi-stations** feature (zone + `location_id`).
3. Fill **airport METAR** ICAO list from **swob-stations** near the citypage point, with **nearest** or **interesting** (name-based boost for major airports) ranking.

Citypage coordinates come from the same English citypage XML path used for conditions (`GetWeatherFileFromECCC` + legacy HPFX fallback), parsed with **ec-weather-js** `location.name` lat/lon compass strings.

## Non-goals

- Replacing curated anchors where they exist (they remain authoritative for verified bundles).
- Non-Canadian METAR auto-picks (SWOB filter requires Canadian-style `Cxxx` ICAO from MSC SWOB `iata_id`).
- Guaranteeing pygeoapi CSV quality for every auto-picked climate id (operators can still override normals/historical manually).

## API

- `POST /api/v1/config/locationFeedSuggestions` — read-only preview (`suggestions` object).
- `POST /api/v1/config/locationQuickSetup` — extended body flags (defaults **false** for API backward compatibility; config UI sends **true** for automation checkboxes).
- `POST /api/v1/config/airportMetarStations` — manual METAR list save.

## Risks

Upstream **api.weather.gc.ca** or citypage fetches may fail; quick setup should still persist primary + province preset; overlays apply only when resolution returns data.
