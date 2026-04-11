# TEST-PLAN — Locations hub + quick setup (2.7.0-rc4)

## Unit (Jest)

| ID | Case | Assert |
| -- | ---- | ------ |
| U1 | `getProvinceTrackingPresetForProvince("MB")` | Length ≥ 1, codes match default Manitoba list shape. |
| U2 | `getProvinceTrackingPresetForProvince("ON")` | Six cities, includes `ON/s0000458`. |
| U3 | `getProvinceTrackingPresetForProvince("QC")` | `null`. |
| U4 | `Config.applyLocationQuickSetup` with mock `fs` | After call, `primaryLocation` matches; with preset ON, `provinceStations` length 6 (via `initializeConfig` pattern if added). |

*Note:* U4 optional if handler tested only via presets + existing `setPrimaryLocation` tests; minimum is U1–U3.

## API / smoke (manual or scripted)

| ID | Case | Steps |
| -- | ---- | ----- |
| A1 | Quick setup happy path | `curl -X POST …/config/locationQuickSetup -d '{"station":{"name":"Toronto","province":"ON","location":"s0000458"},"applyProvincePreset":true}'` → 200; `GET /config` shows Toronto primary + ON grid. |
| A2 | Missing station | POST `{}` → 400/500 with JSON error. |
| A3 | Preset off | `applyProvincePreset: false` leaves province list unchanged (compare before/after). |

## Playwright (E2E)

| ID | Case | Steps |
| -- | ---- | ----- |
| E1 | LTCE search (regression) | Open `/config` → **Locations & feeds** tab → Area name → Search LTCE → table + Use → `#ltceVirtualClimateId` value. |
| E2 | Quick setup mocked | `page.route` `**/config/locationQuickSetup` → 200; click Apply quick setup (or button label) after selecting mocked station if UI requires; assert toast or no network error. |

**Gate:** `yarn gate:rc` (typecheck + jest) and `yarn gate:rc:e2e` before public subtree push.

## Regression matrix

- Display tab misc save still updates reject/records without clearing LTCE (verify `GET /config` LTCE unchanged when only Display misc saved).
- Province tracking fetch still runs after preset (no crash on `climateStationId`).

## Out of scope (manual QA on prod)

- Full MSC live quick setup for every province without mocks.
- METAR / AQHI automation (not in rc4).
