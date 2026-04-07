/** Min/max for `gfx.retro.reloadLineMs` (forecast screen stagger on observation reload). */
export const GFX_RELOAD_LINE_MS_MIN = 30;
export const GFX_RELOAD_LINE_MS_MAX = 500;
export const GFX_RELOAD_LINE_MS_DEFAULT = 100;

/** Same clamp as `GfxRetroApply` uses for `--gfx-reload-line-ms`. */
export function clampReloadLineMs(ms: number | undefined): number {
  const raw = ms ?? GFX_RELOAD_LINE_MS_DEFAULT;
  const n = Math.round(Number(raw));
  return Number.isFinite(n)
    ? Math.min(GFX_RELOAD_LINE_MS_MAX, Math.max(GFX_RELOAD_LINE_MS_MIN, n))
    : GFX_RELOAD_LINE_MS_DEFAULT;
}
