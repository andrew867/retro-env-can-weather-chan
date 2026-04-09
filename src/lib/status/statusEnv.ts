/** `RWC_STATUS_ENABLED=1` forces on; `=0` forces off; otherwise off only when `NODE_ENV=production`. */
export function isStatusDashboardEnabled(): boolean {
  if (process.env.RWC_STATUS_ENABLED === "1") return true;
  if (process.env.RWC_STATUS_ENABLED === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/** Prefer dedicated token; fall back to metrics token (same Bearer scheme). */
export function statusAuthToken(): string | undefined {
  const dedicated = process.env.RWC_STATUS_TOKEN?.trim();
  if (dedicated) return dedicated;
  return process.env.RWC_METRICS_TOKEN?.trim() || undefined;
}
