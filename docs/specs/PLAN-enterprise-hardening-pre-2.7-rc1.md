# PLAN — Enterprise hardening tranche (**before 2.7.0-rc1**)

**SPEC:** [SPEC-enterprise-hardening-pre-2.7-rc1.md](./SPEC-enterprise-hardening-pre-2.7-rc1.md)  
**TEST-PLAN:** [TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md](./TEST-PLAN-enterprise-hardening-pre-2.7-rc1.md)

---

## 0. Goal

One consolidated **bug review + fix** pass so **2.7.0-rc1** ships with:

- bounded failure modes for all feeds in [INVENTORY-feeds.md](./INVENTORY-feeds.md);
- display layers resilient to **partial SSE**, **empty forecast**, and **problematic strings**;
- **fixture coverage** for Winnipeg, Oakville, Hamilton, St. John’s;
- documented operator paths when MSC omits data (not silent failure).

---

## 1. Tranches (execution order)

### Tranche A — Display correctness & “no false empty” (P0)

| ID | Work | Owner hint | Exit |
|----|------|------------|------|
| **A-1** | **St. John’s / apostrophe titles:** Replace naive `city.slice(0, n)` in `conditions.tsx`, `lastmonth.tsx`, `aqhiwarning.tsx` (and grep for others) with **grapheme-safe** truncation or **abbrev table** (`St. John's` → `St.John's` / `St Johns` per authenticity review). Verify 8×32 plate still fits. | FE | TEST-PLAN **B-001** green + screenshot. |
| **A-2** | **Empty `forecastBodies`:** `ForecastScreen` — ensure `onComplete` fires, `pageChangeTimeout` cleared, authentic refresh scheduler no-ops safely. | FE | TEST-PLAN **D2** green. |
| **A-3** | **Flash audit:** Re-verify `screenrotator.tsx` deps (`configVersion` vs `observationID` / `playlistStructureKey`); add Playwright assertion: ≤ N background toggles per M seconds after mock “API restart”. | FE | TEST-PLAN **D3** green. |
| **A-4** | **Conditions null → data:** Hooks merging SSE + HTTP; ensure citypage error does not leave channel without `refetch` path. | FE + API | Manual + optional integration test. |

### Tranche B — Data loading & operator clarity (P0 / P1)

| ID | Work | Exit |
|----|------|------|
| **B-1** | **Climate normals station guide:** Doc table: city → recommended `climateID` / `historicalDataStationID` for Winnipeg, Oakville, Hamilton, St. John’s; note pygeoapi gaps (empty CSV). | OPERATORS or `docs/specs/` appendix; link from config UI text if desired. |
| **B-2** | **Status dashboard / metrics:** Ensure `climate_normals` + `historical` rows reflect “empty parse” vs “never fetched” (optional `note` field). | Snapshot or unit on `buildSnapshot.ts`. |
| **B-3** | **SSE reconnect:** Audit `useWeatherEventStream` + `refetchAllFeedsForFreshness` — all auxiliaries called; idempotent under rapid reconnects. | Log dedupe or manual trace. |
| **B-4** | **Duplicate warns:** Historical + climate normals fetch storms — cap repeated identical warns per time window (`logger` category throttle). | Unit or log review. |

### Tranche C — Fixture pack & CI (P1)

| ID | Work | Exit |
|----|------|------|
| **C-1** | Add **quad-city** JSON fixtures (§3 TEST-PLAN) + one Jest “smoke assembly” test that mounts channel playlist steps with each fixture (no live network). | CI green. |
| **C-2** | Playwright: optional **`?e2eQuadCity=1`** or parameterized spec loading fixture JSON via route intercept for **forecast + conditions** only. | Artifact on CI or nightly. |
| **C-3** | **CHANGELOG** tranche entry listing SPEC/TEST/PLAN and user-visible fixes. | Merged before rc1 tag. |

### Tranche D — Coverage closure (SPEC §6 ↔ tests) (P0 for gate)

| ID | Work | Exit |
|----|------|------|
| **D-1** | Build a **Req → evidence** table: every **R-6.x.x** in SPEC §6 maps to ≥1 of: TEST-PLAN **§4** row, **§5** block (S/C/T/M/H/X), **§6** regression ID, automated file path, or **§8** manual row. | Table committed in ticket or appendix; no orphan Req. |
| **D-2** | Fix doc drift: SPEC release gate, TEST-PLAN §§, PLAN exit checklist cite the same section numbers. | PR review note “docs aligned”. |
| **D-3** | Optional: add Jest `it.each` or Playwright tag linking **R-6.5.3** screen list to minimal mount tests (stubs only). | CI or documented defer to §8 with owner. |

---

## 2. Dependencies & risks

- **ec-weather-js** behaviour varies by station XML shape — raw XML fallbacks (almanac extremes) should remain **last resort** after structured parse fixes.  
- **Playwright** raster tests can be flaky — prefer **deterministic** `?e2e*` fixtures over live MSC for CI.  
- **Authentic refresh** timing interacts with `secondsPerPage` — any change to title width must re-check reload line steps.

---

## 3. Estimates (engineering days, rough)

| Tranche | Days |
|---------|------|
| A | 2–4 |
| B | 2–3 |
| C | 2–4 |
| D | 0.5–1 |
| **Buffer** | 1–2 |

---

## 4. Exit before tagging **2.7.0-rc1**

- [ ] SPEC **§7** release gate satisfied (includes **§6** master checklist + **§8** manual sign-off for any Req without automation).  
- [ ] TEST-PLAN **§4** (server/display + quad-city) + **§5** (subsystem matrix) exercised per Tranche **D-1** mapping.  
- [ ] No P0 items open in this PLAN (including Tranche **D** if scheduled for this rc).  
- [ ] `yarn gate:rc` (+ e2e per policy) green on `main`.  
- [ ] Version bump policy: move to **2.7.0-rc1** only after this tranche merges (separate commit from feature work).

---

## 5. References (code anchors)

| Topic | Path |
|-------|------|
| API route mount order | `src/routes/index.ts` (see SPEC §2 table for `/api/v1/*` groups) |
| Status snapshot builder | `src/lib/status/buildSnapshot.ts` |
| Operator config entry | `src/display/dist/config.tsx`, tabs under `src/display/components/config/*` |
| Status dashboard entry | `src/display/dist/status.tsx` |
| Main channel entry | `src/display/dist/channel.tsx` |
| SSE + refetch wiring | `src/hooks/useWeatherEventStream.ts`, `refetchAllFeedsForFreshness` call sites |
| Conditions title truncation | `src/display/components/weather/conditions.tsx` (`slice(0, 8)`) |
| Last month city | `src/display/components/screens/lastmonth.tsx` |
| AQHI warning city | `src/display/components/screens/aqhiwarning.tsx` |
| Rotator / flash | `src/display/components/screenrotator.tsx` |
| Forecast bodies | `src/lib/display/forecastScreenBodies.ts`, `ForecastScreen` |
| Citypage ingest | `src/lib/eccc/conditions.ts` |
| Climate normals parse | `src/lib/eccc/climateNormals.ts` |
| AQHI fetch | `src/lib/eccc/airQuality.ts` |
| Feed inventory | [INVENTORY-feeds.md](./INVENTORY-feeds.md) |
