type GfxScanlinesLayerProps = {
  enabled: boolean;
};

/** Scanlines overlay; stacked above tear, below nothing else in the raster stack. */
export function GfxScanlinesLayer({ enabled }: GfxScanlinesLayerProps) {
  if (!enabled) return null;
  return <div className="gfx-scanlines-overlay" aria-hidden />;
}
