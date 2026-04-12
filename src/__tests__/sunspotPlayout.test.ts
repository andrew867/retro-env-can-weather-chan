import { Screens } from "consts";
import {
  expandLegacySunspotScreensForPlayout,
  effectiveFlavourScreensForChannelPlaylist,
} from "lib/flavour/sunspotPlayout";
import type { FlavourScreen } from "types";
import type { WeatherStationTimeData } from "types/condition.types";

/** Station-local calendar day 10 → last-month row dropped outside days 1–5 (matches other flavour tests). */
const stationTime: WeatherStationTimeData = {
  observedDateTime: "2026-04-10T12:00:00.000Z",
  stationOffsetMinutesFromLocal: -300,
  timezone: "CDT",
};

describe("expandLegacySunspotScreensForPlayout", () => {
  it("turns legacy SUNSPOTS into flux + SWPC when tropical season flag is false", () => {
    const row: FlavourScreen = { id: Screens.SUNSPOTS, duration: 14 };
    const out = expandLegacySunspotScreensForPlayout([row], false);
    expect(out.map((s) => s.id)).toEqual([Screens.SUNSPOTS_SOLAR_FLUX, Screens.SUNSPOTS_NOAA_SWPC]);
    expect(out.every((s) => s.duration === 14)).toBe(true);
  });

  it("adds tropical step when tropical season flag is true", () => {
    const row: FlavourScreen = { id: Screens.SUNSPOTS, duration: 10 };
    const out = expandLegacySunspotScreensForPlayout([row], true);
    expect(out.map((s) => s.id)).toEqual([
      Screens.SUNSPOTS_SOLAR_FLUX,
      Screens.SUNSPOTS_NOAA_SWPC,
      Screens.SUNSPOTS_TROPICAL,
    ]);
  });

  it("passes explicit new sunspot ids through unchanged", () => {
    const rows: FlavourScreen[] = [
      { id: Screens.SUNSPOTS_SOLAR_FLUX, duration: 5 },
      { id: Screens.ALMANAC, duration: 6 },
    ];
    expect(expandLegacySunspotScreensForPlayout(rows, false)).toEqual(rows);
  });
});

describe("effectiveFlavourScreensForChannelPlaylist", () => {
  it("applies last-month filter then expands legacy sunspots", () => {
    const screens: FlavourScreen[] = [
      { id: Screens.LAST_MONTH_STATS, duration: 14 },
      { id: Screens.SUNSPOTS, duration: 12 },
    ];
    const out = effectiveFlavourScreensForChannelPlaylist(screens, stationTime, true);
    expect(out.some((s) => s.id === Screens.LAST_MONTH_STATS)).toBe(false);
    expect(out.map((s) => s.id)).toEqual([
      Screens.SUNSPOTS_SOLAR_FLUX,
      Screens.SUNSPOTS_NOAA_SWPC,
      Screens.SUNSPOTS_TROPICAL,
    ]);
  });
});
