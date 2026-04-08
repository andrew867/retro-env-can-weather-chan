import { normalizeForecastPlaintext, paginateText8x32 } from "lib/display";
import type { CAPObject, Forecast, WeatherStation } from "types";

function countNonemptyLines(page: string): number {
  return page
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0).length;
}

function hasSparseContinuationPage(pages: string[], maxOrphanLines: number): boolean {
  return pages.some((page, i) => i > 0 && countNonemptyLines(page) <= maxOrphanLines);
}

/**
 * Re-paginates from `raw` while increasing the continuation line budget whenever **any**
 * continuation page (not only the last) has only a few lines—this removes “stupid” 1–2 line
 * middle pages from 8×32 wrapping. Always re-wraps from normalized plaintext.
 */
export function coalesceSparseForecastTailPages(
  raw: string,
  linesFirstPage: number,
  linesContinuationPage: number,
  maxOrphanLines: number = 2,
  maxContBump: number = 24
): string[] {
  const normalized = normalizeForecastPlaintext(raw);
  if (!normalized) return [];

  let cont = linesContinuationPage;
  let pages = paginateText8x32(normalized, linesFirstPage, cont);
  for (let b = 0; b < maxContBump; b++) {
    if (pages.length < 2) break;
    if (!hasSparseContinuationPage(pages, maxOrphanLines)) break;
    cont += 1;
    pages = paginateText8x32(normalized, linesFirstPage, cont);
  }
  return pages;
}

/**
 * Lines for the immediate forecast on the first playlist page (under conditions + optional alert).
 * Kept one line under prior budgets so the last forecast row is not clipped by the footer.
 */
export function immediateLinesFirstPage(hasAlert: boolean): number {
  return hasAlert ? 3 : 4;
}

/**
 * Continuation pages for the *immediate* forecast only (same ECCC period block, split for 8×32 layout).
 */
export const IMMEDIATE_FORECAST_CONTINUATION_LINES = 12;

/** Full-screen “forecast cont..” / supplementary period pages (no conditions block). */
export const FORECAST_CONTINUATION_LINES = 11;

/**
 * ECCC exposes four follow-on periods as separate array slots; paginating each on its own forced
 * short periods (e.g. Wednesday vs Thursday night) onto separate playlist pages even when they
 * easily fit one 8×32 screen. Merge them into one plaintext run, then paginate once.
 */
function appendMergedSupplementaryForecastPages(bodies: string[], slots: (Forecast | undefined)[]): void {
  const parts: string[] = [];
  for (const f of slots) {
    if (!f?.abbreviatedTextSummary?.trim()) continue;
    parts.push(normalizeForecastPlaintext(`${f.period}..${f.abbreviatedTextSummary}`));
  }
  if (parts.length === 0) return;
  const raw = normalizeForecastPlaintext(parts.join(" "));
  const c = FORECAST_CONTINUATION_LINES;
  bodies.push(...coalesceSparseForecastTailPages(raw, c, c));
}

/**
 * Precomputes all forecast “screens” (8×32 paginated bodies) for the rotator.
 * Used by the channel playlist builder and kept pure so SSE/data updates only rebuild this list.
 */
export function buildForecastScreenBodies(
  weatherStationResponse: WeatherStation | undefined,
  alert: CAPObject | undefined
): string[] {
  if (!weatherStationResponse) return [];
  const [immediateForecast, page1Forecast1, page1Forecast2, page2Forecast1, page2Forecast2] =
    weatherStationResponse.forecast ?? [];
  const bodies: string[] = [];
  const hasAlert = !!alert;
  if (immediateForecast?.abbreviatedTextSummary?.trim()) {
    const raw = normalizeForecastPlaintext(
      `Forecast for ${immediateForecast.period}..${immediateForecast.abbreviatedTextSummary}`
    );
    const firstLines = immediateLinesFirstPage(hasAlert);
    const contLines = IMMEDIATE_FORECAST_CONTINUATION_LINES;
    bodies.push(...coalesceSparseForecastTailPages(raw, firstLines, contLines));
  }
  appendMergedSupplementaryForecastPages(bodies, [
    page1Forecast1,
    page1Forecast2,
    page2Forecast1,
    page2Forecast2,
  ]);
  return bodies;
}
