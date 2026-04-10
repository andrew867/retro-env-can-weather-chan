/**
 * NOAA Aviation Weather Center (AWC) METAR API — independent of api.weather.gov; used as a backup when NWS
 * `observations/latest` returns 5xx/503 or is unreachable.
 * @see https://aviationweather.gov/data/api/
 */
import { isAxiosError } from "axios";
import type { AxiosInstance } from "axios";
import { generateConditionsUUID } from "lib/eccc/utils";
import { axiosGetWithRetry } from "lib/reliability/httpRetry";

/** Try bare host first; some resolvers fail `aviationweather.gov` while `www` works (or vice versa). */
export const AWC_METAR_API_BASES = [
  "https://aviationweather.gov/api/data/metar",
  "https://www.aviationweather.gov/api/data/metar",
] as const;

/** @deprecated Prefer {@link AWC_METAR_API_BASES}; kept for callers that only need a display URL. */
export const AWC_METAR_API = AWC_METAR_API_BASES[0];

export type AwcMetarRow = {
  icaoId: string;
  temp?: number;
  reportTime?: string;
  cover?: string;
  fltCat?: string;
  wdir?: number;
  wspd?: number;
  rawOb?: string;
};

export function shouldTryAwcAfterNwsFailure(err: unknown): boolean {
  if (!isAxiosError(err)) return true;
  if (err.code === "ERR_CANCELED") return false;
  const status = err.response?.status;
  if (status == null) return true;
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (status === 408) return true;
  return false;
}

/** When the first AWC host fails before an HTTP status (DNS, timeout, reset), try the alternate base URL. */
export function shouldTryAlternateAwcMetarBase(err: unknown): boolean {
  if (!isAxiosError(err)) return false;
  if (err.code === "ERR_CANCELED") return false;
  if (err.response?.status != null) return false;
  return true;
}

export function formatAwcMetarConditionLine(row: AwcMetarRow): string {
  const cat = row.fltCat?.trim();
  const cover = row.cover?.trim();
  const wind =
    row.wspd != null && row.wdir != null
      ? `${String(row.wdir).padStart(3, "0")}° @ ${row.wspd} kt`
      : row.wspd != null
        ? `${row.wspd} kt`
        : null;
  const parts = [cat, cover, wind].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return "METAR";
}

const METAR_FLT_CAT_DISPLAY_CHARS = 4;

/** Lowercase flight category padded to 4 chars (e.g. `vfr `, `mvfr`) for a fixed-width METAR column. */
export function padAwcMetarFltCatDisplay(raw: string | undefined | null): string {
  const s = (raw ?? "").trim().toLowerCase();
  return s.slice(0, METAR_FLT_CAT_DISPLAY_CHARS).padEnd(METAR_FLT_CAT_DISPLAY_CHARS, " ");
}

/** Cover and wind speed only (no flt cat), for a separate on-screen column. */
export function formatAwcMetarRestLine(row: AwcMetarRow): string {
  const cover = row.cover?.trim().toLowerCase() ?? "";
  const wspd = row.wspd != null ? String(row.wspd) : "";
  const parts: string[] = [];
  if (cover) parts.push(cover);
  if (wspd) parts.push(wspd);
  return parts.length ? parts.join(" · ") : "";
}

function awcReportTimeToUuidKey(reportTime: string): string {
  const digits = reportTime.replace(/[-T:.Z]/g, "");
  return generateConditionsUUID(digits.length >= 12 ? digits : digits.padEnd(12, "0"));
}

export type ParsedAwcStationObservation = {
  temperatureC: number;
  condition: string;
  conditionUUID: string;
};

export function parseAwcMetarRow(row: AwcMetarRow): ParsedAwcStationObservation | null {
  if (row.temp == null || Number.isNaN(Number(row.temp))) return null;
  const reportTime = row.reportTime ?? new Date().toISOString();
  return {
    temperatureC: Number(row.temp),
    condition: formatAwcMetarConditionLine(row),
    conditionUUID: awcReportTimeToUuidKey(reportTime),
  };
}

/**
 * Fetch latest METAR rows for one or more ICAO ids (e.g. KTPA or CYYZ).
 */
export async function fetchAwcMetarRows(
  client: AxiosInstance,
  icaoIds: string[],
  timeoutMs: number
): Promise<Map<string, AwcMetarRow>> {
  const out = new Map<string, AwcMetarRow>();
  if (!icaoIds.length) return out;
  const ids = [...new Set(icaoIds.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  const query = `ids=${ids.map(encodeURIComponent).join(",")}&format=json`;
  let lastErr: unknown;
  for (let i = 0; i < AWC_METAR_API_BASES.length; i++) {
    const base = AWC_METAR_API_BASES[i]!;
    const url = `${base}?${query}`;
    try {
      const resp = await axiosGetWithRetry<AwcMetarRow[]>(client, url, {
        timeout: timeoutMs,
        rwcUpstream: { feed: "awc_metar", key: ids.slice(0, 8).join(",") },
      });
      const rows = Array.isArray(resp.data) ? resp.data : [];
      for (const r of rows) {
        if (r?.icaoId) out.set(String(r.icaoId).toUpperCase(), r);
      }
      return out;
    } catch (err) {
      lastErr = err;
      const tryNext = i < AWC_METAR_API_BASES.length - 1 && shouldTryAlternateAwcMetarBase(err);
      if (!tryNext) throw err;
    }
  }
  throw lastErr;
}
