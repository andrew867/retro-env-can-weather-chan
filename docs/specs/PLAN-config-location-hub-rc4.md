# PLAN — Implement Locations hub + quick setup (2.7.0-rc4)

## Phases

### Phase A — Presets + server (this RC)

1. Add `src/lib/config/locationQuickSetupPresets.ts` with `getProvinceTrackingPresetForProvince(province: string): ProvinceStations | null`.
2. Add `Config.applyLocationQuickSetup(station, { applyProvincePreset })` calling `setPrimaryLocation` then optional `setProvinceStations`.
3. Add `postLocationQuickSetup` in `routeHandler.ts`, wire `POST /config/locationQuickSetup` in `routes/config.ts`.
4. Document in `docs/api/openapi.yaml` + `REST-COOKBOOK.md` (curl one-liner optional).

### Phase B — UI consolidation

1. Add `LtceBackfillSection.tsx` (LTCE search + id + save misc with reject/records/log from props).
2. Trim `DisplayConfig`: remove LTCE block; misc save omits `ltceVirtualClimateId` (unchanged server-side).
3. Add `LocationsHubConfig.tsx` composing quick setup card + existing station/province/historical/normals/air/LTCE sections.
4. Update `display/dist/config.tsx` tab list: **Locations & feeds** first; remove separate tabs for Weather Station, Province, Historical, Climate Normals, Air Quality; pass props into hub.
5. Export hub from `display/components/config/index.ts`.

### Phase C — Tests + gates

1. Unit: `locationQuickSetupPresets.test.ts` (MB/ON/non-ON).
2. Optional: route handler integration with `initializeConfig` mock pattern if low value — presets test + manual smoke may suffice.
3. Playwright: move LTCE visual test to **Locations** tab (`getByRole("tab", { name: /locations/i })`); add `config-locations-hub-quicksetup.spec.ts` with route mock for `locationQuickSetup`.
4. Run `yarn gate:rc` and `yarn gate:rc:e2e` before subtree push.

### Phase D — Docs for operators

1. `OPERATORS.md` — new tab name, quick setup behaviour, pointer to SPEC; subtree reminder unchanged.

## rc5+ (not scheduled here)

- Server `GET /config/locationResolve?code=` using MSC `climate-stations` + LTCE search to propose STN / normals / LTCE for **any** citypage (with confidence + operator confirm).
- Config UI: METAR editor + “suggest nearest ICAO” from primary lat/lon once exposed in init/config.
- AQHI: zone/code suggest from MSC AQHI station search API.

## Files touched (expected)

| Path | Change |
| ---- | ------ |
| `src/lib/config/locationQuickSetupPresets.ts` | **New** |
| `src/lib/config/config.ts` | `applyLocationQuickSetup` |
| `src/lib/config/routeHandler.ts` | `postLocationQuickSetup` |
| `src/routes/config.ts` | route |
| `src/display/components/config/ltceBackfillSection.tsx` | **New** |
| `src/display/components/config/locationsHub.tsx` | **New** |
| `src/display/components/config/display.tsx` | LTCE removed; misc save |
| `src/display/components/config/index.ts` | export |
| `src/display/dist/config.tsx` | tabs |
| `playwright/tests/config-ltce-search-visual.spec.ts` | tab navigation |
| `playwright/tests/config-locations-hub-quicksetup.spec.ts` | **New** |
| `src/__tests__/locationQuickSetupPresets.test.ts` | **New** |
| `docs/specs/*-rc4.md` | this cycle |
| `docs/api/openapi.yaml` | path |
| `OPERATORS.md` | short note |
| `package.json` | `2.7.0-rc4` |

## Rollback

Revert tab layout + route; anchors remain independent.
