/** Low-pass style step toward a random target (first-order smoothing). */
export function smoothVhsTearOffset(prev: number, target: number, alpha: number): number {
  if (!Number.isFinite(prev) || !Number.isFinite(target) || !Number.isFinite(alpha)) return 0;
  const a = Math.min(1, Math.max(0, alpha));
  return prev + a * (target - prev);
}

export const VHS_TEAR_TICK_MS = 90;
export const VHS_TEAR_ALPHA = 0.36;
/** Peak horizontal offset amplitude (px); keep small so it reads as tracking wobble, not slide show. */
export const VHS_TEAR_AMPLITUDE_PX = 5.5;

/** Playwright / visual regression: `?e2eVhsTear=1` freezes horizontal offset so bottom-band screenshots are stable. */
export function isE2eStaticVhsTear(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("e2eVhsTear") === "1";
  } catch {
    return false;
  }
}
