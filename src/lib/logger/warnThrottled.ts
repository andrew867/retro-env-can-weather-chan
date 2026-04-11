/** Last emit time per key — caps identical operator-facing warns during fetch storms. */
const lastEmitMs = new Map<string, number>();

export function warnThrottled(key: string, intervalMs: number, emit: () => void): void {
  const now = Date.now();
  const prev = lastEmitMs.get(key) ?? 0;
  if (now - prev < intervalMs) return;
  lastEmitMs.set(key, now);
  emit();
}
