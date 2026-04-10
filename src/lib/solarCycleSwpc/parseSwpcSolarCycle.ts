import type {
  SolarCycleSwpcDaily,
  SolarCycleSwpcMonthlyObserved,
  SolarCycleSwpcMonthlyPredicted,
} from "types";

export function pickLastDailySsn(rows: unknown): SolarCycleSwpcDaily | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const last = rows[rows.length - 1];
  if (!last || typeof last !== "object") return null;
  const r = last as Record<string, unknown>;
  const Obsdate = r.Obsdate;
  const swpc_ssn = r.swpc_ssn;
  if (typeof Obsdate !== "string" || typeof swpc_ssn !== "number" || !Number.isFinite(swpc_ssn)) return null;
  return { obsDateIso: Obsdate, swpcSsn: Math.round(swpc_ssn) };
}

/** Last monthly row with usable totals (non-negative SSN and F10.7). */
export function pickLastMonthlyIndices(rows: unknown): SolarCycleSwpcMonthlyObserved | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const tag = r["time-tag"];
    const ssn = r.ssn;
    const observed_swpc_ssn = r.observed_swpc_ssn;
    const f10 = r["f10.7"];
    if (typeof tag !== "string" || !/^\d{4}-\d{2}$/.test(tag)) continue;
    if (typeof ssn !== "number" || typeof observed_swpc_ssn !== "number" || typeof f10 !== "number") continue;
    if (!Number.isFinite(ssn) || !Number.isFinite(observed_swpc_ssn) || !Number.isFinite(f10)) continue;
    if (ssn < 0 || f10 < 0) continue;
    return {
      timeTag: tag,
      ssn: Math.round(ssn),
      observedSwpcSsn: Math.round(observed_swpc_ssn),
      f107: Math.round(f10),
    };
  }
  return null;
}

export function pickPredictedForUtcMonth(
  rows: unknown,
  year: number,
  month1to12: number
): SolarCycleSwpcMonthlyPredicted | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const want = `${year}-${String(month1to12).padStart(2, "0")}`;
  const parsed: SolarCycleSwpcMonthlyPredicted[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const tag = r["time-tag"];
    const ps = r.predicted_ssn;
    const pf = r["predicted_f10.7"];
    if (typeof tag !== "string" || !/^\d{4}-\d{2}$/.test(tag)) continue;
    if (typeof ps !== "number" || typeof pf !== "number" || !Number.isFinite(ps) || !Number.isFinite(pf)) continue;
    parsed.push({ timeTag: tag, predictedSsn: Math.round(ps), predictedF107: Math.round(pf) });
  }
  if (!parsed.length) return null;
  const byTag = new Map(parsed.map((p) => [p.timeTag, p]));
  const exact = byTag.get(want);
  if (exact) return exact;
  const sorted = [...parsed].sort((a, b) => a.timeTag.localeCompare(b.timeTag));
  const future = sorted.find((p) => p.timeTag >= want);
  if (future) return future;
  return sorted[sorted.length - 1] ?? null;
}
