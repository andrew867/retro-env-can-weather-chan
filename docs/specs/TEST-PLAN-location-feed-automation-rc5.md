# TEST-PLAN — MSC location feed automation (rc5)

## Unit (Jest)

- `locationFeedGeo.haversineKm` — known short chord (e.g. Toronto core vs nearby point) stable within tolerance.
- `resolveLocationFeedSuggestions` — **mocked** `fetchCitypageLatLon` + `backendAxios.get` returns minimal GeoJSON for climate + aqhi + swob; assert structured fields on `suggestions`.

## HTTP / manual

- `POST /config/locationFeedSuggestions` with a real MSC citypage station — expect non-null `citypageLatLon` for common sites.
- `POST /config/locationQuickSetup` with flags false — behaviour matches pre-rc5 (primary + preset only).

## Playwright

- `config-locations-hub-quicksetup.spec.ts` — intercept `locationQuickSetup`; assert `station` + `applyProvincePreset`. When the served Parcel bundle includes rc5 UI, also assert MSC overlay booleans + `metarHeuristic` (skips those checks if a stale `dist/` is reused via `reuseExistingServer`).

## Gate

`yarn gate:rc` and `yarn gate:rc:e2e`.
