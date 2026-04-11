# PLAN — MSC location feed automation (rc5)

## Deliverables

| Area | Work |
|------|------|
| Backend | `citypageLatLon.ts`, `locationFeedGeo.ts`, `mscLocationFeedResolve.ts`; extend `Config.applyLocationQuickSetup`, `setAirportMetarStations`; async `postLocationQuickSetup`; new `postLocationFeedSuggestions`, `postAirportMetarStations`. |
| Types | `locationFeed.types.ts` exported via `types/index.ts`. |
| UI | Locations hub: MSC checkboxes, METAR heuristic radio, preview button; `AirportMetarConfig` editor. |
| Docs | SPEC/PLAN/TEST (this set), OpenAPI, OPERATORS line, CHANGELOG `2.7.0-rc5`. |
| QA | Jest (geo + mocked resolve), Playwright quick-setup POST body extended in mock test. |

## Verification

`yarn gate:rc` and `yarn gate:rc:e2e`.
