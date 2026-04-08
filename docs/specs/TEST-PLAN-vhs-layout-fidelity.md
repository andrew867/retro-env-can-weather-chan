# Test plan: VHS layout fidelity

## Principles

- Visual authenticity is judged primarily against VHS/reference stills, not only against existing automated snapshots.
- Automated checks still guard against accidental regressions in code quality and behavior.
- This tranche should avoid “passing” by introducing new UI chrome that is absent from the historical references.

## Existing checks to preserve

- `yarn lint`
- `yarn test --passWithNoTests`
- Existing Playwright/baseline screenshots remain useful as coarse regression checks, but not as the primary authenticity source.

## New / updated validation categories

### T1 — No non-authentic screen chrome

| ID | Case | Assert |
|----|------|--------|
| T1.1 | Forecast screen | No added small title strip inside the plate |
| T1.2 | Outlook screen | No added small title strip inside the plate |
| T1.3 | Almanac screen | No added small title strip inside the plate |
| T1.4 | Province temp/precip screen | No added small title strip inside the plate |

### T2 — Forecast / almanac fit

| ID | Case | Assert |
|----|------|--------|
| T2.1 | Forecast conditions | No right-edge clipping on wind / air quality / forecast body |
| T2.2 | Almanac conditions | No right-edge clipping on pressure / conditions rows |
| T2.3 | Almanac records table | Record columns remain visible and aligned without obvious microtext scaling |

### T3 — Province temp / precip proportions

| ID | Case | Assert |
|----|------|--------|
| T3.1 | Province body | Rows feel proportionally close to `images/province-tracking.png` |
| T3.2 | Province columns | Header/body columns remain aligned |
| T3.3 | Province width | No right-edge clipping of precip text |

### T4 — Crawler / frame balance

| ID | Case | Assert |
|----|------|--------|
| T4.1 | Forecast frame | Crawler does not visually overwhelm the plate when content is dense |
| T4.2 | Province frame | Crawler/body/footer proportions feel close to the VHS/reference captures |

## Manual comparison set

- User-provided VHS screenshots captured in the current planning context
- `../../images/forecast.png`
- `../../images/outlook.png`
- `../../images/almanac-temps.png`
- `../../images/province-tracking.png`

## Definition of done

- T1–T4 reviewed and satisfied
- `yarn lint` passes
- `yarn test --passWithNoTests` passes
- Resulting layout is judged to preserve the original broadcast spirit without invented UI elements

## Related docs

- [SPEC-vhs-layout-fidelity.md](./SPEC-vhs-layout-fidelity.md)
- [PLAN-vhs-layout-fidelity.md](./PLAN-vhs-layout-fidelity.md)
