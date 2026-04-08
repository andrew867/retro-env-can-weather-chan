# Phased plan: VHS layout fidelity

**Status: planned**. This tranche is intentionally limited to visual authenticity and layout fit. No version-number or release-policy changes are included.

---

## Phase 1 — Remove non-authentic additions

| # | Work item | Target files |
|---|-----------|--------------|
| **1.1** | Remove any invented in-plate title strip or similar chrome | `src/display/components/screenrotator.tsx`, `src/display/style/main.scss` |
| **1.2** | Reconfirm the display stack proportions (`crawler` → `display` → `footer`) against the VHS/reference stills | `src/display/style/main.scss`, `src/display/style/vars.scss` |

**Phase 1 exit criteria:** No extra title/header line exists inside the plate; the frame structure matches the historical look more closely.

---

## Phase 2 — Forecast / almanac proportion fixes

| # | Work item | Target files |
|---|-----------|--------------|
| **2.1** | Rebalance the forecast conditions block so it fits without right-edge clipping | `src/display/components/weather/conditions.tsx`, `src/display/style/forecast.scss`, `src/display/style/conditions.scss` |
| **2.2** | Rebalance the almanac conditions + records stack so it fits the plate without looking shrunken | `src/display/components/screens/almanac.tsx`, `src/display/style/forecast.scss` |

**Phase 2 exit criteria:** Forecast and almanac resemble the VHS/reference stills in spacing and no longer clip on the right.

---

## Phase 3 — Province temp / precip authenticity cleanup

| # | Work item | Target files |
|---|-----------|--------------|
| **3.1** | Rework province temp/precip type scale and column spacing so the plate feels full rather than compressed | `src/display/components/screens/provincetracking.tsx`, `src/display/style/forecast.scss` |
| **3.2** | Verify the crawler does not visually overpower the province plate once body proportions are restored | `src/display/style/main.scss`, `src/display/style/forecast.scss` |

**Phase 3 exit criteria:** Province temp/precip looks proportionally close to `images/province-tracking.png` while preserving stable alignment.

---

## Verification

- `yarn lint`
- `yarn test --passWithNoTests`
- Manual screenshot comparison against:
  - user-provided VHS screenshots
  - `../../images/forecast.png`
  - `../../images/outlook.png`
  - `../../images/almanac-temps.png`
  - `../../images/province-tracking.png`

## Deferred until after visuals are stable

- Semantic versioning / dev-cycle policy
- `CHANGELOG.md` and `package.json` updates
- GitHub publish or release-tag workflow changes

## Related docs

- [SPEC-vhs-layout-fidelity.md](./SPEC-vhs-layout-fidelity.md)
- [TEST-PLAN-vhs-layout-fidelity.md](./TEST-PLAN-vhs-layout-fidelity.md)
