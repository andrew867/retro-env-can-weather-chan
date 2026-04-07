import { useLayoutEffect } from "react";
import type { GfxRuntimeConfig } from "types";

/** Applies `gfx` to `#weather_channel` (host div) via CSS variables + classes. */
export function GfxRetroApply({ gfx }: { gfx?: GfxRuntimeConfig }) {
  useLayoutEffect(() => {
    const el = document.getElementById("weather_channel");
    if (!el) return;
    const r = gfx?.retro;
    const sa = gfx?.safeArea;
    el.style.setProperty("--gfx-scanline-opacity", String(r?.scanlinesOpacity ?? 0));
    el.style.setProperty("--gfx-vignette", String(r?.vignetteStrength ?? 0));
    el.style.setProperty("--gfx-safe-top", String(sa?.top ?? 0.02));
    el.style.setProperty("--gfx-safe-bottom", String(sa?.bottom ?? 0.06));
    el.style.setProperty("--gfx-safe-left", String(sa?.left ?? 0.02));
    el.style.setProperty("--gfx-safe-right", String(sa?.right ?? 0.02));
    const tint = r?.phosphorTint ?? "none";
    el.classList.remove("gfx-phosphor-none", "gfx-phosphor-green", "gfx-phosphor-amber");
    el.classList.add(`gfx-phosphor-${tint}`);
    if (r?.scanlinesOpacity && r.scanlinesOpacity > 0.001) el.classList.add("gfx-scanlines-on");
    else el.classList.remove("gfx-scanlines-on");
  }, [gfx]);
  return null;
}
