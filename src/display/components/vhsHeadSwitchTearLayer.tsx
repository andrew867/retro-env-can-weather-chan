import {
  smoothVhsTearOffset,
  VHS_TEAR_ALPHA,
  VHS_TEAR_AMPLITUDE_PX,
  VHS_TEAR_TICK_MS,
} from "lib/display/vhsHeadSwitchTear";
import { useEffect, useState } from "react";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

type VhsHeadSwitchTearLayerProps = {
  /** Master: caller passes `vhsAnalogLayerEnabled && vhsHeadSwitchTearEnabled`. */
  enabled: boolean;
};

/**
 * Bottom-band overlay mimicking VHS head-switch horizontal instability. Updates `--gfx-vhs-tear-x` on
 * `#weather_channel` on a low-rate interval (not every animation frame).
 */
export function VhsHeadSwitchTearLayer({ enabled }: VhsHeadSwitchTearLayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const drive = enabled && !reducedMotion;

  useEffect(() => {
    const host = document.getElementById("weather_channel");
    if (!host || !enabled) return;

    if (!drive) {
      host.style.setProperty("--gfx-vhs-tear-x", "0px");
      return () => {
        host.style.removeProperty("--gfx-vhs-tear-x");
      };
    }

    let x = 0;
    const tick = () => {
      if (document.hidden) return;
      const target = (Math.random() * 2 - 1) * VHS_TEAR_AMPLITUDE_PX;
      x = smoothVhsTearOffset(x, target, VHS_TEAR_ALPHA);
      host.style.setProperty("--gfx-vhs-tear-x", `${x.toFixed(2)}px`);
    };

    tick();
    const id = window.setInterval(tick, VHS_TEAR_TICK_MS);
    return () => {
      window.clearInterval(id);
      host.style.removeProperty("--gfx-vhs-tear-x");
    };
  }, [enabled, drive]);

  if (!enabled) return null;

  return (
    <div className="gfx-vhs-head-switch-tear" aria-hidden>
      <div className="gfx-vhs-head-switch-tear__band" />
    </div>
  );
}
