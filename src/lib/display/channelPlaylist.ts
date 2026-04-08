import { Screens } from "consts";
import type { CAPObject, FlavourScreen, WeatherStation } from "types";
import { buildForecastScreenBodies } from "./forecastScreenBodies";
import { buildOutlookScreenBodies, type OutlookPlaylistPage } from "./outlookScreenBodies";

/**
 * Expand a flavour’s screen list into a flat playout sequence.
 * - Most screens stay one rotator step (`timed`).
 * - `FORECAST` becomes N steps (`forecast_page`), one per precomputed text page.
 * - `OUTLOOK` becomes N steps (`outlook_page`) when the regional outlook exceeds one footer-safe page.
 *
 * Future screen types (news ticker page, schedule, etc.) can add new `kind` variants here.
 */
export type ChannelPlaylistContext = {
  weatherStationResponse: WeatherStation | undefined;
  alert: CAPObject | undefined;
};

export type ChannelPlaylistEntry =
  | { kind: "timed"; screen: FlavourScreen }
  | {
      kind: "forecast_page";
      screen: FlavourScreen;
      bodies: readonly string[];
      pageIndex: number;
    }
  | {
      kind: "outlook_page";
      screen: FlavourScreen;
      bodies: readonly OutlookPlaylistPage[];
      pageIndex: number;
    };

/**
 * Stable string when playlist *topology* changes (screen order, forecast page count, etc.).
 * Used by `ScreenRotator` to reset playout when e.g. an alert clears mid-forecast without a new
 * `observationID`.
 */
export function getChannelPlaylistStructureKey(playlist: ChannelPlaylistEntry[]): string {
  return playlist
    .map((e) =>
      e.kind === "forecast_page"
        ? `F${e.bodies.length}.${e.pageIndex}`
        : e.kind === "outlook_page"
          ? `O${e.bodies.length}.${e.pageIndex}`
          : `T${String(e.screen.id)}`
    )
    .join(">");
}

export function buildChannelPlaylist(
  screens: FlavourScreen[],
  ctx: ChannelPlaylistContext
): ChannelPlaylistEntry[] {
  const out: ChannelPlaylistEntry[] = [];
  for (const screen of screens) {
    if (screen.id === Screens.FORECAST) {
      const bodies = buildForecastScreenBodies(ctx.weatherStationResponse, ctx.alert);
      const pageCount = Math.max(1, bodies.length);
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        out.push({ kind: "forecast_page", screen, bodies, pageIndex });
      }
    } else if (screen.id === Screens.OUTLOOK) {
      const bodies = buildOutlookScreenBodies(ctx.weatherStationResponse);
      if (bodies.length === 0) continue;
      for (let pageIndex = 0; pageIndex < bodies.length; pageIndex++) {
        out.push({ kind: "outlook_page", screen, bodies, pageIndex });
      }
    } else {
      out.push({ kind: "timed", screen });
    }
  }
  return out;
}
