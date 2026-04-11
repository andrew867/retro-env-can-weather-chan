# Coverage map — Enterprise hardening (pre **2.7.0-rc1**)

**SPEC:** [SPEC-enterprise-hardening-pre-2.7-rc1.md](./SPEC-enterprise-hardening-pre-2.7-rc1.md)  
**TEST-PLAN:** [TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md](./TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md)  
**Appendix:** [APPENDIX-quad-city-climate-ids.md](./APPENDIX-quad-city-climate-ids.md)

This file satisfies PLAN **Tranche D-1** (Req → evidence). Rows without a Jest path rely on existing integration/e2e or **TEST-PLAN §8** manual sign-off.

| Req | Evidence (automated) | TEST-PLAN |
|-----|----------------------|-----------|
| R-6.1.1–R-6.1.9 | `yarn test` route/handler suites; `yarn smoke` post-deploy | §4.1 A*, §5 S* |
| R-6.2.1 | `ecccConditions.test.ts`, historical merge tests | §4.1 A1, §5 |
| R-6.2.2 | `climateNormals.test.ts`, `historicalTempPrecip.test.ts` | §4.1 A2–A3 |
| R-6.2.3 | National/province/AQHI/sunspots unit tests under `src/__tests__` | §5 |
| R-6.2.4 | `configValidation.test.ts` | §5 S3 |
| R-6.2.5 | Storage init in server bootstrap (manual §8 if no unit) | §8 |
| R-6.3.1–R-6.3.7 | Config UI: manual save paths §8; flavour screen IDs `flavour.test.ts` | §5 C*, §6 |
| R-6.4.1–R-6.4.3 | `buildSnapshot.ts` notes for `historical` / `climate_normals`; status dashboard Playwright `status-dashboard-visual.spec.ts` | §5 T*, §4 |
| R-6.5.1 | `channel.tsx` + `hooks/weather.ts` JSDoc; hook refetch wiring | §5 M2, H1 |
| R-6.5.2 | `channelPlaylist*.test.ts`, `screenrotator.tsx` | §4.2 D3 |
| R-6.5.3 | `channelQuadCitySmoke.test.ts`, screen RTL tests (`statsScreen`, `airportMetarScreen`, …) | §3, §5 M3 |
| R-6.5.4–R-6.5.6 | Footer/crawler/GFX: Playwright `vhs-head-switch-tear-visual`, `e2e*` modes | §5 M4 |
| R-6.6.1 | Log level gate tests / OPERATORS | §5 X2 |
| R-6.6.2 | Display axios metrics (`channel.tsx` interval) | §5 X1 |
| R-6.6.3 | `conditionsStJohnsTitle.test.tsx`, `outlookRegionalLabel.test.ts` (full city / no regional overrides) | §4.2 D4, B-001 |
| R-4.3.x | `forecast.tsx` empty-body `onComplete`; rotator flash fix in CHANGELOG 2.6.7 | §4.2 D1–D3 |

**B-004 (AQHI log throttle):** `warnThrottled` in `climateNormals.ts` / `historicalTempPrecip.ts` + manual once if logger assertions absent.
