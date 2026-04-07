import { isValid, parseISO } from "date-fns";

/** ECCC citypage can lag; flag snapshots older than this in the footer. */
export const STALE_SNAPSHOT_THRESHOLD_MINUTES = 25;

export function isSnapshotStale(
  iso: string | null | undefined,
  thresholdMin: number = STALE_SNAPSHOT_THRESHOLD_MINUTES
): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  if (!isValid(d)) return false;
  return Date.now() - d.getTime() > thresholdMin * 60 * 1000;
}
