# SPEC — Config “Locations & feeds” hub + quick setup (2.7.0-rc4)

## Problem

Operators configure **primary citypage**, **historical / normals / LTCE**, **province grid**, and **AQHI** on separate tabs. Curated MSC station IDs live in code (`citypageClimateAnchors.ts`) for a handful of cities; anything else requires manual IDs. New sites want a **single place** to pick a city and get a **known-good bundle**, with **advanced overrides** still available.

## Goals

1. **One config tab** (“Locations & feeds”) that groups all location-driven feeds and MSC identifiers used for observed adjuncts (historical last-year, normals, province yesterday precip bulk id, LTCE).
2. **Quick setup** at the top: pick a primary station (existing citypage search), optional **province tracking preset** for supported provinces, then **one POST** that applies `setPrimaryLocation` (including anchored historical / normals / LTCE when a curated citypage code exists) plus preset province list when enabled.
3. **Advanced sections** below unchanged behaviour: operators can still edit historical STN, normals, province rows, AQHI independently after quick setup.
4. **No fabricated data**: quick setup only applies MSC-backed presets and existing anchor table; unknown citypage codes skip province preset and rely on anchors only when present.

## Non-goals (rc4)

- **Fully automatic** MSC `climate-stations` / LTCE resolution for every Canadian citypage (rate limits, ambiguous names, normals vs hourly STN split). Documented as **rc5+** follow-up (server-side resolver + cache).
- **Airport METAR “nearest”** or **AQHI “nearest”** heuristics (need lat/lon + catalog APIs). rc4 leaves METAR list as today (defaults in `rwc-config.json`); UI note in PLAN.
- **Removing** individual `POST /config/*` endpoints — quick setup is additive; clients may still call granular routes.

## UX (config SPA)

| Section | Contents |
| -------- | --------- |
| **Quick setup** | City search (reuse flow), checkboxes: “Apply ON/MB-style province grid preset when available”, primary select → `POST /config/locationQuickSetup`. |
| **Primary weather station** | Existing `WeatherStationConfig`. |
| **Province temp / precip** | Existing `ProvinceTempPrecipConfig`. |
| **Historical station ID** | Existing `HistoricalDataStationIDConfig`. |
| **Climate normals** | Existing `ClimateNormalsConfig`. |
| **Air quality** | Existing `AirQualityConfig`. |
| **LTCE almanac backfill** | Search + virtual id field (moved from Display tab); saves via `POST /config/misc` with current reject/records/log level preserved. |

**Display tab** retains misc (hourly gate, alternate records URL), look/feel, playlist — **not** LTCE.

## API

### `POST /api/v1/config/locationQuickSetup`

**Body**

```json
{
  "station": { "name": "string", "province": "ON", "location": "s0000458" },
  "applyProvincePreset": true
}
```

**Behaviour**

1. `setPrimaryLocation(station)` — existing anchor merge for historical, normals, LTCE when `getCitypageClimateAnchor(location)` matches.
2. If `applyProvincePreset` is true: `setProvinceStations(true, preset)` where `preset` comes from `getProvinceTrackingPresetForProvince(station.province)`; if `null`, skip (no error).

**Responses**

- `200` — config saved once (`updateAndSaveConfigOption` single transaction).
- `400` — missing `station` or invalid shape.
- `500` — server error JSON.

## Data — province presets (rc4)

| Province | Preset source |
| -------- | -------------- |
| `MB` | `PROVINCE_TRACKING_DEFAULT_STATIONS` (existing verified STNs). |
| `ON` | Six-city grid matching shipped example (`Toronto`, `Ottawa`, `Hamilton`, `London`, `Kitchener`, `Windsor`) — `climateStationId` filled via existing `mergeProvinceStationClimateDefaults` + anchors where defined. |

Other provinces: **no preset** (checkbox has no effect until a future catalog exists).

## Risks / mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Operator expects AQHI/METAR auto | Copy in UI + OPERATORS: rc4 is primary + province preset + anchors only. |
| Double tab confusion | Remove old duplicate tabs; single hub. |
| LTCE save vs misc save | LTCE section posts full misc with reject/records from current config snapshot props. |

## Success criteria

- New install: operator opens **Locations & feeds**, searches city, enables preset (ON/MB), applies quick setup, restarts unnecessary — `GET /config` shows aligned bundle + province rows with `climateStationId` where applicable.
- Playwright: LTCE search still works from Locations tab; quick setup returns 200 with mocked POST (optional).

## Related

- `citypageClimateAnchors.ts` — curated MSC bundles.
- `mergeProvinceStationClimateDefaults` — province row bulk STN backfill.
