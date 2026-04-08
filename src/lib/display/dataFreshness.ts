import { isValid, parseISO } from "date-fns";

/**
 * How old our last successful ingest may be before the footer shows “ECCC snapshot may be outdated”.
 *
 * Surface observations and citypage text are often **hourly**; a 25-minute window false-positived as soon as
 * wall clock passed the obs time (e.g. 4:53 PM with a 4:00 PM stamp) or when AMQP was quiet for one cycle.
 * ~90m tolerates one full hourly gap plus broker/parse jitter.
 *
 * Feeds polled slower than this (e.g. provincial hot/cold at 6h) must stay **out** of the footer list.
 */
export const STALE_SNAPSHOT_THRESHOLD_MINUTES = 90;

export function isSnapshotStale(
  iso: string | null | undefined,
  thresholdMin: number = STALE_SNAPSHOT_THRESHOLD_MINUTES
): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  if (!isValid(d)) return false;
  return Date.now() - d.getTime() > thresholdMin * 60 * 1000;
}
