# Test plan: VHS head-switch tear

## Automated

| Case | How |
|------|-----|
| Smoothing step | Unit test `smoothVhsTearOffset(prev, target, alpha)` converges toward target and stays bounded when target is bounded |
| Config merge | `clampGfxRetro` sets boolean when missing (false) and preserves true/false when set |
| Reduced motion | Manual or future e2e: with `prefers-reduced-motion: reduce`, tear driver does not advance offset (or overlay hidden) |

## Manual / visual

| Case | Pass |
|------|------|
| Analog **off**, tear **on** (if UI allows) | No visible tear band |
| Analog **on**, tear **off** | Same as before feature (grain/shimmer only) |
| Analog **on**, tear **on** | Bottom band visible; horizontal wobble subtle; no layout shift of UI text |
| Tab backgrounded | Motion stops or pauses (no runaway timers) |
| 16:9 + HD | Band scales; no stray overflow outside frame |

## Regression

- Existing Playwright visual fixtures keep `vhsHeadSwitchTearEnabled: false` (or analog off) so snapshots unchanged.

## Out of scope (v1)

- Pixel-diff baselines of the tear band (too flaky across GPUs / fonts).
