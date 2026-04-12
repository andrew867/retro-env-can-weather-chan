/** MSC reporting thresholds for “no measurable” (display as padded NIL). */
const LIQUID_REPORTING_THRESHOLD_MM = 0.2;
const SNOW_REPORTING_THRESHOLD_CM = 0.05;

/** Padded column token for MSC no measurable / below threshold (matches historical plate width). */
export const PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY = "NIL".padStart(5);

/**
 * Format 24h precip for the province tracking screen column.
 *
 * MSC: padded NIL for amounts below reporting threshold (0.2 mm liquid, 0.05 cm snow) including numeric zero,
 * and for the literal token NIL (no detectable precipitation). N/A means data not available → MISSING.
 * TRACE only when the feed is explicitly trace; MISSING for null / non-finite / M / N/A / missing sentinel.
 */
export function formatProvinceYesterdayPrecipDisplay(
  precip: string | number | null | undefined,
  unit: string | null | undefined
): string {
  const unitStr = (unit == null ? "" : String(unit)).toLowerCase();
  const isSnow = unitStr.includes("snow") || (unitStr.includes("cm") && !unitStr.includes("mm"));

  if (precip === null || precip === undefined) return "MISSING";

  if (typeof precip === "string") {
    const t = precip.trim();
    if (t === "") return "MISSING";
    if (/^trace$/i.test(t)) return "TRACE";
    if (/^(missing|m)$/i.test(t)) return "MISSING";
    if (/^n\/a$/i.test(t)) return "MISSING";
    if (/^nil$/i.test(t)) return PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY;
    const asNum = Number(t);
    if (Number.isFinite(asNum)) {
      return formatProvinceYesterdayPrecipDisplay(asNum, unit);
    }
    return t;
  }

  const n = Number(precip);
  if (!Number.isFinite(n) || n < 0) return "MISSING";

  const threshold = isSnow ? SNOW_REPORTING_THRESHOLD_CM : LIQUID_REPORTING_THRESHOLD_MM;
  if (n < threshold) return PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY;

  const displayUnit = unit == null ? "" : String(unit);
  const noPrecipType = displayUnit.length === 2;
  return `${noPrecipType ? "".padStart(2) : ""}${n.toFixed(1)} ${displayUnit || "mm"}`.toUpperCase();
}
