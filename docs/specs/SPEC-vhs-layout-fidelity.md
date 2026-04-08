# Specification: VHS layout fidelity tranche

## References

- User-provided VHS screenshots for forecast, outlook, almanac, and province temp/precip
- Repo reference stills:
  - `../../images/forecast.png`
  - `../../images/outlook.png`
  - `../../images/almanac-temps.png`
  - `../../images/province-tracking.png`
- Existing display implementation:
  - `../../src/display/components/screenrotator.tsx`
  - `../../src/display/components/weather/conditions.tsx`
  - `../../src/display/style/main.scss`
  - `../../src/display/style/forecast.scss`

## Goal

Restore the weather display to the original broadcast spirit by matching the VHS/reference layout more closely and removing non-authentic UI additions.

## Non-goals

- Changing semantic versioning or release policy
- Updating `CHANGELOG.md`, `package.json`, release tags, or publish workflow
- Inventing new layout chrome, metadata bars, or screen-title overlays

## Current problems

1. Forecast and almanac conditions are still too width-constrained and clip near the right edge.
2. Province temp/precip feels undersized and cramped relative to the historical stills.
3. The crawler can overpower the plate when the body is compressed.
4. Recent fixes risk solving overflow by adding non-authentic UI instead of restoring the plate proportions.

## Requirements

### R1 — No invented chrome

- Do not add a small in-plate title line such as `FORECAST — WINNIPEG`.
- Do not add any new header row that is absent from the VHS/reference images.

### R2 — Forecast / almanac fit

- Forecast and almanac conditions must fit inside the blue plate without right-edge clipping.
- The conditions block must remain visually consistent with the repo/VHS references: centered within the plate, not compressed into a narrow synthetic column.
- Almanac records rows must remain aligned and readable without looking obviously downscaled.

### R3 — Province temp / precip proportions

- Province temp/precip must visually fill the plate like the historical reference.
- Column alignment must remain fixed and readable.
- Horizontal fit must come from authentic proportions and spacing, not from arbitrary microtext.

### R4 — Crawler balance

- The crawler must remain authentic in look and placement.
- The crawler must not dominate the frame because the body has been over-compressed.

### R5 — Authenticity-first verification

- Manual comparison against VHS/reference stills is the primary visual check.
- Playwright canonical screenshots are regression aids only and must not override authenticity when they conflict.

## Acceptance criteria

- No extra small title strip exists inside `#display`.
- Forecast and almanac screenshots no longer show right-edge clipping of conditions text.
- Province temp/precip looks proportionally close to `../../images/province-tracking.png`.
- The crawler/body/footer stack resembles the VHS/reference captures in spirit without introducing obvious modern UI artifacts.
- Lint and tests pass after the visual cleanup.

## Related docs

- [PLAN-vhs-layout-fidelity.md](./PLAN-vhs-layout-fidelity.md)
- [TEST-PLAN-vhs-layout-fidelity.md](./TEST-PLAN-vhs-layout-fidelity.md)
- [CHANGELOG.md](../../CHANGELOG.md)
