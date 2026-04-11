# TEST-PLAN — LTCE almanac records backfill

## Automated

| ID | Case | Expected |
|----|------|----------|
| T1 | Parse CSV fixture (header + one `VSMB38V` row for `4-11`) | `extremeMax.value === 25`, `extremeMax.year === 1968`, `extremeMin.value === -22.8`, `extremeMin.year === 1881` (matches live API sample at time of spec; fixture encodes frozen row). |
| T2 | Malformed CSV / empty body | Returns `null`, no throw. |
| T3 | Cache: two calls same id+month+day within TTL | Single HTTP (assert with `jest.spyOn(axios, "get")` mock). |
| T4 | `setMiscSettings(..., "")` for 4th `ltceVirtualClimateId` | `misc.ltceVirtualClimateId` becomes `undefined`. |
| T5 | `setMiscSettings` with 5th arg `undefined` | Leaves `ltceVirtualClimateId` unchanged (see `config.setMiscSettings`). |

**Fixture:** embed minimal two-line CSV in test file (header + data row) so tests stay offline.

**Regression:** `yarn test` full suite; `yarn typecheck`.

## Manual (operator)

1. Set **LTCE Virtual Climate ID** to `VSMB38V`, save misc on `/config`.
2. Confirm **Almanac** screen shows **Records** columns populated (after a citypage refresh / SSE).
3. Set **alternate records JSON URL** with conflicting values — confirm JSON **overrides** LTCE for hi/lo.
4. Clear LTCE field — confirm records fall back to empty when citypage has no almanac (expected post-2024 MSC).

## Out of scope here

- Live Playwright against `api.weather.gc.ca` (flaky in CI).
