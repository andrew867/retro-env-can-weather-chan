import { useLayoutEffect } from "react";
import { clampReloadLineMs, SCREEN_BACKGROUND_BLUE } from "consts";
import type { GfxRetroColourPreset, GfxRuntimeConfig } from "types";

const GFX_RETRO_PRESET_CLASSES: GfxRetroColourPreset[] = ["none", "nes", "c64", "green", "amber"];

type GfxRetroApplyProps = {
  gfx?: GfxRuntimeConfig;
  /** Widescreen frame only applies with REC-era official fonts (new look & feel). */
  useOfficialFonts?: boolean;
};

/** Applies `gfx` to `#weather_channel` (host div) via CSS variables + classes. */
export function GfxRetroApply({ gfx, useOfficialFonts = true }: GfxRetroApplyProps) {
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
    el.style.setProperty("--gfx-reload-line-ms", String(clampReloadLineMs(r?.reloadLineMs)));
    const tint = r?.phosphorTint ?? "none";
    const safeTint = GFX_RETRO_PRESET_CLASSES.includes(tint as GfxRetroColourPreset) ? tint : "none";
    GFX_RETRO_PRESET_CLASSES.forEach((p) => el.classList.remove(`gfx-phosphor-${p}`));
    el.classList.add(`gfx-phosphor-${safeTint}`);
    if (r?.scanlinesOpacity && r.scanlinesOpacity > 0.001) el.classList.add("gfx-scanlines-on");
    else el.classList.remove("gfx-scanlines-on");
    if (r?.vhsAnalogLayerEnabled) el.classList.add("gfx-vhs-analog-on");
    else el.classList.remove("gfx-vhs-analog-on");

    const aspectWide = useOfficialFonts && gfx?.displayAspectRatio === "16:9";
    el.classList.remove("rwc-aspect-4-3", "rwc-aspect-16-9");
    el.classList.add(aspectWide ? "rwc-aspect-16-9" : "rwc-aspect-4-3");

    const res = gfx?.displayResolution === "hd" ? "hd" : "sd";
    el.classList.remove("rwc-resolution-sd", "rwc-resolution-hd");
    el.classList.add(res === "hd" ? "rwc-resolution-hd" : "rwc-resolution-sd");
    const scale = res === "hd" ? 2 : 1;
    el.style.setProperty("--rwc-ui-scale", String(scale));
    /** Match `rwc-resolution-hd` frame size so safe-area padding and bar heights stay consistent when scaled. */
    el.style.setProperty("--channel-max-height", `${480 * scale}px`);
    el.style.setProperty("--channel-max-width", `${640 * scale}px`);

    el.style.setProperty("--rwc-pillar-color", SCREEN_BACKGROUND_BLUE);
  }, [gfx, useOfficialFonts]);
  return null;
}
