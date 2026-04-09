# Specification: VHS head-switch “tear” band (bottom of frame)

## References

- Existing stack: `../../src/display/style/main.scss` — `#weather_channel.gfx-vhs-analog-on::before` (grain/shimmer), `::after` scanlines
- `../../src/display/components/gfxRetroApply.tsx` — toggles `gfx-vhs-analog-on`
- `../../src/display/components/config/gfx.tsx` — operator toggles for retro look

## Why the effect exists (physical / signal)

Consumer VHS records video on a **helical scan**: two (or four) heads on a rotating drum write **diagonal tracks** across the tape. One field (or half-frame) is laid down per head pass. The **head-switching point** is where the active video head **hands off** to the next head. That transition is not perfectly seamless:

1. **Head-switching pulse (HSP)** — A brief interval where **luminance/chrominance timing** differs between heads; electronics mask it in the **vertical blanking** region, but on many decks and **especially on copies**, a **horizontal band** of **noise**, **wrong horizontal phase**, or **displaced picture** can appear at the **bottom** of the visible raster (or just into active video on misadjusted sets).
2. **Tracking errors** — If the tape path or tracking servo is off, the **switch point can drift vertically** frame-to-frame and the **bottom band “tears”** or **wobbles** horizontally relative to the lines above.
3. **Time-base error (TBC off or poor)** — Unstable horizontal sync makes the **discontinuity slide** left/right; **off-air or nth-generation dubs** exaggerate this.
4. **Not the same as RF broadcast-only artifacts** — **Antenna / multipath** can cause ghosts and sparklies, but the **classic bottom horizontal “VHS tear”** is strongly associated with **tape transport + head switch**, not with a clean RF feed. Operators who want **“retro broadcast analogue” without tape** should keep this effect **off** while leaving grain/scanlines on if desired.

## Goal

Add an **optional**, **cheap** visual nod to **tape dub** aesthetics: a **thin bottom band** that suggests **horizontal instability + noise** at the head-switch region, **without** true framebuffer displacement (which would require per-pixel copy or heavy shaders).

## Non-goals

- Pixel-accurate simulation of a full **TBC** or **VCR servo loop**
- **Canvas** full-frame readback each frame on low-CPU broadcast VMs
- Changing **line breaks**, **safe area**, or **4:3 raster geometry**

## Requirements

### R1 — Operator control

- New persisted flag under `gfx.retro`, e.g. **`vhsHeadSwitchTearEnabled`** (boolean).
- **Effective only when** `vhsAnalogLayerEnabled` is **true** (tape-style stack is on); if analog is off, tear does nothing (UI may still show the toggle disabled or auto-off — implementation choice documented in PLAN).

### R2 — Aesthetic target

- Band height ~**5–9%** of frame height (configurable constant in SCSS only unless we later expose a slider).
- **Horizontal jitter** in the **± few px** range at **low temporal frequency** (roughly **8–15 Hz** max update rate), with **smoothing** so motion is not white noise per frame.
- **Blend** with existing picture: **mix-blend-mode** + modest **opacity** so it reads as **imperfect tape**, not a solid bar.

### R3 — Performance

- **No `requestAnimationFrame` every frame** at 60 fps for logic; prefer a **single `setInterval` / sparse tick** (~**80–120 ms**) updating one CSS custom property on `#weather_channel`.
- **Pause** updates when `document.hidden` is true.
- **`prefers-reduced-motion: reduce`**: **no motion** (static band optional at 0 offset or hide band entirely).

### R4 — Accessibility

- Decorative only: `aria-hidden` on overlay; respect reduced motion.

## Acceptance criteria

- With analog **on** and tear **on**, bottom band is visible and **subtly unstable**; with tear **off**, picture matches prior **analog-only** look.
- CPU profile: no sustained high-frequency JS; one style property update on a **≤15 Hz** timer when visible.
- Documented in **OPERATORS.md** next to other Graphics / VHS options.

## Related docs

- [PLAN-vhs-head-switch-tear.md](./PLAN-vhs-head-switch-tear.md)
- [TEST-PLAN-vhs-head-switch-tear.md](./TEST-PLAN-vhs-head-switch-tear.md)
