import { isValid, parseISO } from "date-fns";

/**
 * ECCC citypage can lag; flag snapshots older than this in the footer.
 * Feeds polled slower than this (e.g. hot/cold spots at 30m) must not be included in the footer list or they false-positive.
 */
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
