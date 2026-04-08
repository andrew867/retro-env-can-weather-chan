import { format } from "date-fns";
import { getDaysAheadFromObserved } from "lib/date";
import { getOutlookForAreaLabel } from "lib/display/outlookRegionalLabel";
import type { Forecast, WeatherStation } from "types";

function forecastStartsWithWeekday(period: string | undefined, weekdayLower: string): boolean {
  const p = (period ?? "").toLowerCase().trim();
  return p === weekdayLower || p.startsWith(`${weekdayLower} `) || p.startsWith(`${weekdayLower}.`);
}

/** Body lines under the title; each string is one raster row (32-col style). */
export type OutlookPlaylistPage = {
  title: string | null;
  bodyLines: readonly string[];
};

/** First page: title + this many body rows (footer-safe). Continuation pages omit the title. */
const OUTLOOK_FIRST_PAGE_BODY_LINES = 6;
const OUTLOOK_CONTINUATION_BODY_LINES = 7;

/** One day = high/low line + condition line; normals = final line. Never split a day across pages. */
function outlookBodySegments(bodyLines: string[]): string[][] {
  if (bodyLines.length === 0) return [];
  if (bodyLines.length <= 2) return [bodyLines];
  const normalLine = bodyLines[bodyLines.length - 1];
  const dayLines = bodyLines.slice(0, -1);
  if (dayLines.length % 2 !== 0) return [bodyLines];
  const segments: string[][] = [];
  for (let i = 0; i < dayLines.length; i += 2) {
    segments.push([dayLines[i], dayLines[i + 1]]);
  }
  /** Keep climate-normal line with the last day block so it is not stranded alone on a sparse page. */
  if (segments.length > 0 && normalLine?.trim()) {
    segments[segments.length - 1].push(normalLine);
  }
  return segments;
}

function computeOutlookBodyLines(ws: WeatherStation): { title: string; lines: string[] } | null {
  const { stationID, city, forecast, stationTime, almanac } = ws;
  const title = `Outlook for ${getOutlookForAreaLabel(stationID, city)}`;

  if (!forecast?.length || !stationTime?.observedDateTime) {
    return null;
  }

  const twoDaysAway = getDaysAheadFromObserved(stationTime, 2);
  const weekdayKey = format(twoDaysAway, "EEEE").toLowerCase();
  const startIx = forecast.findIndex((f: Forecast) => forecastStartsWithWeekday(f.period, weekdayKey));
  if (startIx === -1) {
    return { title, lines: ["No outlook available"] };
  }

  const days: { period: string; low: number; high: number; condition: string }[] = [];
  for (let dayNum = 1, dayIx = startIx; dayNum <= 3; dayNum++) {
    const forecastDay = forecast[dayIx++];
    const forecastNight = forecast[dayIx++];
    if (!forecastDay?.period) break;
    days.push({
      period: forecastDay.period,
      high: forecastDay?.temperature?.value ?? 0,
      low: forecastNight?.temperature?.value ?? 0,
      condition: (forecastDay?.conditions?.split("or")[0] ?? "").trim(),
    });
  }

  if (!days.length) {
    return { title, lines: ["No outlook available"] };
  }

  const longestDayName = Math.max(...days.map((d) => d.period.length), 3);
  const lines: string[] = [];
  for (const d of days) {
    const p = d.period.padEnd(longestDayName, ".");
    lines.push(`${p}..Low ${d.low}.  High ${d.high}.`);
    lines.push(`${"".padStart(5)}${d.condition}.`);
  }
  lines.push(
    `Normal Low ${almanac?.temperatures?.normalMin?.value?.toFixed(0) ?? "N/A"}. High ${almanac?.temperatures?.normalMax?.value?.toFixed(0) ?? "N/A"}.`
  );

  return { title, lines };
}

/** Segment-aware pagination (exported for tests). */
export function buildOutlookPlaylistPages(title: string, bodyLines: string[]): OutlookPlaylistPage[] {
  const segments = outlookBodySegments(bodyLines);
  if (segments.length === 0) {
    return [{ title, bodyLines: [] }];
  }

  const pages: OutlookPlaylistPage[] = [];
  let current: string[] = [];
  let budget = OUTLOOK_FIRST_PAGE_BODY_LINES;
  let isFirstPage = true;

  const flush = () => {
    if (current.length === 0) return;
    pages.push({
      title: isFirstPage ? title : null,
      bodyLines: [...current],
    });
    current = [];
    isFirstPage = false;
    budget = OUTLOOK_CONTINUATION_BODY_LINES;
  };

  for (const seg of segments) {
    const need = seg.length;
    if (need > budget && current.length === 0) {
      pages.push({
        title: isFirstPage ? title : null,
        bodyLines: [...seg],
      });
      isFirstPage = false;
      budget = OUTLOOK_CONTINUATION_BODY_LINES;
      continue;
    }
    if (current.length + need > budget) {
      flush();
    }
    current.push(...seg);
  }
  flush();
  return pages;
}

/**
 * One rotator step per page so tall regional outlooks are not clipped by the footer.
 */
export function buildOutlookScreenBodies(weatherStationResponse: WeatherStation | undefined): OutlookPlaylistPage[] {
  if (!weatherStationResponse) {
    return [];
  }
  const computed = computeOutlookBodyLines(weatherStationResponse);
  if (computed === null) {
    return [];
  }
  const { title, lines } = computed;
  return buildOutlookPlaylistPages(title, lines);
}
