type GfxVhsAnalogGrainLayerProps = {
  enabled: boolean;
};

/** Grain + shimmer; must sit in `.rwc-channel-stack` so z-order vs tear/scanlines is correct (host `::after` would cover the tear). */
export function GfxVhsAnalogGrainLayer({ enabled }: GfxVhsAnalogGrainLayerProps) {
  if (!enabled) return null;
  return <div className="gfx-vhs-analog-grain" aria-hidden />;
}
