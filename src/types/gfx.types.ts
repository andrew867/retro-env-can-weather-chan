/** Toggle staged visual / motion work without redeploying assets. */
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

/** Phosphor tint for CRT-style colour grading (faithful REC-era look). */
export type GfxPhosphorTint = "none" | "green" | "amber";

/**
 * Retro presentation controls (scanlines, tint, vignette). All optional; off when unset.
 */
export type GfxRetroLook = {
  /** 0 = off; ~0.06–0.12 typical for subtle horizontal lines */
  scanlinesOpacity?: number;
  phosphorTint?: GfxPhosphorTint;
  /** 0–1 edge darkening */
  vignetteStrength?: number;
};

/** Client-visible contract for graphics (flags, safe area, retro look). */
export type GfxRuntimeConfig = {
  features?: GfxFeatureFlags;
  safeArea?: GfxSafeArea;
  retro?: GfxRetroLook;
};
