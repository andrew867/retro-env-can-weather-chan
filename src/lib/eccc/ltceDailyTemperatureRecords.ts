import type { AxiosInstance } from "axios";
import backendAxios from "lib/backendAxios";
import Logger from "lib/logger";
import { warnThrottled } from "lib/logger/warnThrottled";
import { formatFetchError } from "lib/eccc/fetchErrors";

const logger = new Logger("ltceDailyTemperatureRecords");

/** Winnipeg Area — threaded virtual station aligned with MSC citypage MB-38 (see LTCE station CSV). */
export const LTCE_WINNIPEG_AREA_VIRTUAL_CLIMATE_ID = "VSMB38V";

const LTCE_TEMPERATURE_ITEMS_URL = "https://api.weather.gc.ca/collections/ltce-temperature/items";

const CACHE_TTL_MS = 60 * 60 * 1000;

type LtceExtreme = { value: number; year: number; unit: "C" };

export type LtceDailyExtremes = {
  extremeMax: LtceExtreme;
  extremeMin: LtceExtreme;
};

type CacheEntry = { value: LtceDailyExtremes | null; expiresAt: number };

let cache: CacheEntry | null = null;
let cacheKey = "";

/** Test helper — clears in-memory LTCE CSV cache between cases. */
export function resetLtceTemperatureCacheForTests(): void {
  cache = null;
  cacheKey = "";
}

function cacheKeyFor(virtualClimateId: string, month: number, day: number): string {
  return `${virtualClimateId}|${month}|${day}`;
}

/**
 * Parse first data row of MSC LTCE temperature CSV (OGC Features `f=csv`).
 * Uses column names from the official CSV header.
 */
export function parseLtceTemperatureCsv(csv: string): LtceDailyExtremes | null {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return null;

  const headers = lines[0]!.split(",");
  const hiIdx = headers.indexOf("RECORD_HIGH_MAX_TEMP");
  const hiYrIdx = headers.indexOf("RECORD_HIGH_MAX_TEMP_YR");
  const loIdx = headers.indexOf("RECORD_LOW_MIN_TEMP");
  const loYrIdx = headers.indexOf("RECORD_LOW_MIN_TEMP_YR");
  if (hiIdx === -1 || hiYrIdx === -1 || loIdx === -1 || loYrIdx === -1) return null;

  const cols = lines[1]!.split(",");
  const need = Math.max(hiIdx, hiYrIdx, loIdx, loYrIdx) + 1;
  if (cols.length < need) return null;
  const hi = Number(cols[hiIdx]);
  const hiYr = Number(cols[hiYrIdx]);
  const lo = Number(cols[loIdx]);
  const loYr = Number(cols[loYrIdx]);
  if (!Number.isFinite(hi) || !Number.isFinite(lo) || !Number.isFinite(hiYr) || !Number.isFinite(loYr)) {
    return null;
  }

  return {
    extremeMax: { value: hi, year: Math.trunc(hiYr), unit: "C" },
    extremeMin: { value: lo, year: Math.trunc(loYr), unit: "C" },
  };
}

/**
 * Daily calendar-day record max/min temperatures for a virtual LTCE station (local month/day).
 */
export async function fetchLtceDailyTemperatureExtremes(
  virtualClimateId: string,
  localMonth: number,
  localDay: number,
  axiosInstance: AxiosInstance = backendAxios
): Promise<LtceDailyExtremes | null> {
  const id = virtualClimateId.trim();
  if (!id || localMonth < 1 || localMonth > 12 || localDay < 1 || localDay > 31) return null;

  /** Jest sets `JEST_WORKER_ID` — keep default suite offline unless opt-in (see unit tests). */
  if (process.env.JEST_WORKER_ID !== undefined && process.env.RWC_LTCE_JEST_FETCH !== "1") {
    return null;
  }

  const ck = cacheKeyFor(id, localMonth, localDay);
  const now = Date.now();
  if (cache && cacheKey === ck && cache.expiresAt > now) {
    return cache.value;
  }

  const url = new URL(LTCE_TEMPERATURE_ITEMS_URL);
  url.searchParams.set("VIRTUAL_CLIMATE_ID", id);
  url.searchParams.set("LOCAL_MONTH", String(localMonth));
  url.searchParams.set("LOCAL_DAY", String(localDay));
  url.searchParams.set("f", "csv");
  url.searchParams.set("limit", "5");

  try {
    const { data } = await axiosInstance.get<string>(url.toString(), {
      responseType: "text",
      timeout: 20_000,
      validateStatus: (s) => s === 200,
    });
    const parsed = typeof data === "string" ? parseLtceTemperatureCsv(data) : null;
    cache = { value: parsed, expiresAt: now + CACHE_TTL_MS };
    cacheKey = ck;
    if (!parsed) {
      warnThrottled("ltce_csv_parse_empty", 120_000, () =>
        logger.warn("LTCE temperature CSV parse returned empty for", ck)
      );
    }
    return parsed;
  } catch (err) {
    warnThrottled(`ltce_fetch_${formatFetchError(err)}`, 120_000, () =>
      logger.warn("LTCE temperature fetch failed:", formatFetchError(err))
    );
    cache = { value: null, expiresAt: now + 5 * 60 * 1000 };
    cacheKey = ck;
    return null;
  }
}
