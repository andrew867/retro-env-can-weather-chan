/** Experimental visual / motion features (off by default). */
export type GfxFeatureFlags = {
  authenticRefreshEnabled?: boolean;
  nextGenVisualLayersEnabled?: boolean;
};

/**
 * Normalized 0–1 insets from each edge (of the full frame) reserved for legibility.
 * Used before “WOW” overlays so critical type stays readable.
 */
export type GfxSafeArea = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

/**
 * Colour grading preset (RetroArch-style: broadcast default, 8‑bit “system” looks, or CRT mono).
 * Persisted under `phosphorTint` in JSON for backward compatibility with older configs.
 */
export type GfxRetroColourPreset = "none" | "nes" | "c64" | "green" | "amber";

/** @deprecated Use GfxRetroColourPreset */
export type GfxPhosphorTint = GfxRetroColourPreset;

/**
 * Retro presentation controls (scanlines, colour preset, vignette). All optional; off when unset.
 */
export type GfxRetroLook = {
  /** 0 = off; ~0.06–0.12 typical for subtle horizontal lines */
  scanlinesOpacity?: number;
  /** Colour grading preset (field name is historical). */
  phosphorTint?: GfxRetroColourPreset;
  /** 0–1 edge darkening */
  vignetteStrength?: number;
  /**
   * Tape/VHS-style grain + subtle bottom-band shimmer (full broadcast colour; not mono terminal).
   * Pairs with scanlines; uses `::before` so it does not fight the scanline `::after` overlay.
   */
  vhsAnalogLayerEnabled?: boolean;
  /**
   * Delay between each `.reload-animation` step on forecast reload (ms). Clamped server-side.
   * Exposed as `--gfx-reload-line-ms` on `#weather_channel`.
   */
  reloadLineMs?: number;
};

/** Classic SD frame vs widescreen with side pillars (4:3 content safe area). */
export type GfxDisplayAspectRatio = "4:3" | "16:9";

/** Logical raster: SD (640×480) or HD (1280×720) — scales UI via `--rwc-ui-scale`. */
export type GfxDisplayResolution = "sd" | "hd";

/** Client-visible contract for graphics (flags, safe area, retro look). */
export type GfxRuntimeConfig = {
  features?: GfxFeatureFlags;
  safeArea?: GfxSafeArea;
  retro?: GfxRetroLook;
  /**
   * When `useOfficialFonts` is on (REC-era look): `16:9` letterboxes the 640×480 raster in a widescreen
   * frame and extends the current screen background colour into the side pillars. `4:3` keeps the classic
   * fixed 640×480 canvas (centered on the page with black matting).
   */
  displayAspectRatio?: GfxDisplayAspectRatio;
  /** `hd` sets `--rwc-ui-scale: 2` (640×480 → 1280×960 logical) for OBS / streaming. */
  displayResolution?: GfxDisplayResolution;
};
