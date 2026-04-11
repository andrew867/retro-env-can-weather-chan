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

/**
 * Single playout page: full outlook (title + all body lines) in one rotator dwell.
 * (Previously paginated into continuation pages; product wants one plate.)
 */
export function buildOutlookPlaylistPages(title: string, bodyLines: string[]): OutlookPlaylistPage[] {
  return [{ title, bodyLines: [...bodyLines] }];
}

/** One rotator step with the complete regional outlook. */
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
