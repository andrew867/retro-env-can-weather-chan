import { Screens } from "consts";
import { filterFlavourScreensForPlayout } from "lib/flavour/lastMonthStatsSchedule";
import type { FlavourScreen } from "types";
import type { WeatherStationTimeData } from "types/condition.types";

/**
 * Legacy flavours use a single {@link Screens.SUNSPOTS} row; playout expands it into separate rotator
 * steps (full dwell each) so flux, SWPC, and tropical outlook are readable.
 */
export function expandLegacySunspotScreensForPlayout(
  screens: FlavourScreen[],
  includeTropicalSunspotStep: boolean
): FlavourScreen[] {
  const out: FlavourScreen[] = [];
  for (const screen of screens) {
    if (screen.id === Screens.SUNSPOTS) {
      out.push({ ...screen, id: Screens.SUNSPOTS_SOLAR_FLUX });
      out.push({ ...screen, id: Screens.SUNSPOTS_NOAA_SWPC });
      if (includeTropicalSunspotStep) {
        out.push({ ...screen, id: Screens.SUNSPOTS_TROPICAL });
      }
    } else {
      out.push(screen);
    }
  }
  return out;
}

/** Filter (e.g. last-month schedule) then expand legacy sunspot rows for `buildChannelPlaylist`. */
export function effectiveFlavourScreensForChannelPlaylist(
  screens: FlavourScreen[] | undefined,
  stationTime: WeatherStationTimeData | undefined,
  seasonSunspot: boolean
): FlavourScreen[] {
  const filtered = filterFlavourScreensForPlayout(screens, stationTime);
  return expandLegacySunspotScreensForPlayout(filtered, seasonSunspot);
}
