# Plan: VHS head-switch tear implementation

## Approach (mathematically motivated, implementation-light)

**Real system (simplified):** horizontal error at the switch line can be modeled as a **low-pass filtered random walk** (tracking servo + TBC trying to pull error toward zero) with **occasional larger steps** (dropout-like). We avoid simulating the full servo and instead use:

- Every tick \( \Delta t \approx 80\text{–}120\,\text{ms} \): draw a new **target** \(t_k \sim U(-a, a)\) (px).
- **Smooth** toward target with **exponential smoothing**  
  \( x_{k+1} = x_k + \alpha\,(t_k - x_k) \), \(\alpha \in (0.2, 0.45)\),  
  equivalent to a **first-order low-pass** on a stepped input — cheap, stable, no history buffer.

Optional **rare larger** targets (e.g. 10% of ticks use \(1.6a\)) can be added later; v1 keeps a single uniform for fewer branches.

**Rendering:** One absolutely positioned **strip** at the bottom of `#weather_channel`, **above** main analog grain (`z-index` between existing `::before` and scanline `::after`). Inner div uses `transform: translate3d(var(--gfx-vhs-tear-x), 0, 0)` and **CSS gradients** for **horizontal streakiness** (no texture fetch, no canvas).

## Files to touch

| Area | File |
|------|------|
| Types | `src/types/gfx.types.ts` — add `vhsHeadSwitchTearEnabled?: boolean` on `GfxRetroLook` |
| Defaults / normalize | `src/lib/config/config.ts` — `DEFAULT_GFX.retro`, `clampGfxRetro` |
| Init fixture | `src/__tests__/testdata/hooks/init.json`, `playwright/fixtures/forecastVisualStation.ts` — `false` for pixel-stable tests |
| Config UI | `src/display/components/config/gfx.tsx` — switch + save payload |
| Apply class / vars | `src/display/components/gfxRetroApply.tsx` — optional `--gfx-vhs-tear-x` init to `0px` when disabled |
| Hook + component | `src/lib/display/vhsHeadSwitchTear.ts` (pure smooth step) + `src/display/components/vhsHeadSwitchTearLayer.tsx` |
| Mount | `src/display/dist/channel.tsx` — render layer when analog && tear |
| Styles | `src/display/style/main.scss` — `.gfx-vhs-head-switch-tear` |
| Docs | `docs/specs/SPEC-*.md`, `TEST-PLAN-*.md`, `OPERATORS.md` (one bullet) |
| Unit test | `src/__tests__/vhsHeadSwitchTear.test.ts` |

## Risks / mitigations

- **Z-order:** Tear must sit **below** scanlines if we want CRT lines “on top”; spec targets **between** grain and scanlines — verify visually once.
- **Widescreen 16:9:** Strip still `left:0; right:0` on `#weather_channel` (full host); OK.
- **HD scale:** Use `%` height so band scales with host; `--rwc-ui-scale` already scales the frame.

## Rollout

- **`vhsHeadSwitchTearEnabled: false`** in **`DEFAULT_GFX.retro`** and when the key is missing after merge (`clampGfxRetro`). Operators enable **VHS head-switch tear** in Graphics for tape-dub look; grain-only RF style keeps this **off**.
