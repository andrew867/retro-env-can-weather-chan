# PLAN — LTCE almanac records backfill

## Tranche 1 — Core (this delivery)

1. **SPEC** — `SPEC-ltce-almanac-records.md` (source, mapping, precedence, caching).
2. **Library** — `src/lib/eccc/ltceDailyTemperatureRecords.ts`
   - Build OGC Features items URL with query params.
   - Parse single CSV row; map to `{ extremeMax, extremeMin }` with `unit: "C"`.
   - TTL cache (1 h) by virtual id + local month/day.
3. **Server wiring** — `src/lib/eccc/conditions.ts`
   - After `fillAlmanacExtremesFromRawCitypageXml`, run `applyLtceAlmanacExtremesIfNeeded()` then existing `getTempRecordsForDay()` in one async chain (`void mergeAlmanacRecordSources()`).
   - Emit `EVENT_BUS_AUXILIARY_WEATHER_DATA_READY` when LTCE fills any missing extreme.
4. **Config** — `MiscConfig.ltceVirtualClimateId`, defaults, `setMiscSettings` / `saveConfig` / `postMisc` body.
5. **UI** — `DisplayConfig` + `config.tsx` prop for LTCE id + helper text + link to SPEC / MSC LTCE readme.
6. **Validation** — `configValidation.ts` optional pattern warning for malformed ids.
7. **Tests** — `src/__tests__/ltceDailyTemperatureRecords.test.ts` with fixture CSV (no network).
8. **Docs** — `TEST-PLAN-ltce-almanac-records.md`, **CHANGELOG** entry.

## Tranche 2 — Future (not in this PR)

- Resolve `VIRTUAL_CLIMATE_ID` from `siteList` / GeoJSON or a bundled map `citypageSiteCode → LTCE id`.
- Status dashboard row for last LTCE fetch / error (optional).
- Playwright smoke: almanac screen shows numeric records when fixture citypage omits almanac (heavy).

## Risks

- **api.weather.gc.ca** availability / rate limits — mitigated by TTL cache and warn-throttled logs.
- **Leap day:** LTCE rows use `LOCAL_MONTH` / `LOCAL_DAY`; use station-local `Date` from existing `observedDateTimeAtStation()`.
