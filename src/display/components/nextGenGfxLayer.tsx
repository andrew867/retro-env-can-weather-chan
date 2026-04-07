/** Reserved overlay slot for branding / future assets when `nextGenVisualLayersEnabled` is on. */
export function NextGenGfxLayer({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <div className="gfx-nextgen-layer" aria-hidden />;
}
