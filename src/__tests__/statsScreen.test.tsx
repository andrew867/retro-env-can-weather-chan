/** @jest-environment jsdom */

import { render } from "@testing-library/react";
import * as React from "react";
import { StatsScreen } from "display/components/screens/stats";
import { STATS_SCREEN_MAX_CHARACTERS_PER_LINE } from "consts/display.consts";
import type { HotColdSpots, Season, SunRiseSet, WeatherStationTimeData } from "types";

const time: WeatherStationTimeData = {
  observedDateTime: "2026-12-15T18:00:00.000Z",
  stationOffsetMinutesFromLocal: -360,
  timezone: "CST",
};

const sun: SunRiseSet = {
  rise: "2026-12-15T14:30:00.000Z",
  set: "2026-12-15T23:59:00.000Z",
  timezone: "UTC",
};

const season: Season = {
  season: { windchill: true, sunspot: false, winter: true },
  seasonPrecip: { amount: 123.4, normal: 98.7, unit: "mm", type: "total" },
};

const hotCold: HotColdSpots = {
  lastUpdated: "2026-12-15T12:00:00.000Z",
  hotSpot: { name: "NINETEENCHARNAMEMARK", province: "ON", temperature: -3 },
  coldSpot: { name: "NINETEENCHARNAMEMARK", province: "YT", temperature: -42 },
};

describe("StatsScreen", () => {
  it("keeps fixed-width data rows within STATS_SCREEN_MAX_CHARACTERS_PER_LINE (title row may be longer for official names)", () => {
    const { container } = render(
      <div id="weather_channel">
        <StatsScreen
          city="WINNIPEG"
          weatherStationTime={time}
          season={season}
          sunRiseSet={sun}
          hotColdSpots={hotCold}
        />
      </div>
    );
    const rows = container.querySelectorAll("#stats_screen > div");
    const lengths = [...rows].map((el) => el.textContent?.length ?? 0);
    // Row 0: "{city} statistics - …" (one plate line); from row 1 onward use the legacy raster width budget.
    expect(Math.max(...lengths.slice(1))).toBeLessThanOrEqual(STATS_SCREEN_MAX_CHARACTERS_PER_LINE);
  });

  it("shows city plus statistics date on a single title line", () => {
    const { container } = render(
      <div id="weather_channel">
        <StatsScreen
          city="St. John's"
          weatherStationTime={time}
          season={season}
          sunRiseSet={sun}
          hotColdSpots={hotCold}
        />
      </div>
    );
    const first = container.querySelector("#stats_screen > div");
    expect(first?.textContent).toMatch(/^St\. John's statistics - /);
  });

  it("does not throw when station offset is NaN (invalid upstream time fields)", () => {
    const badOffsetTime = { ...time, stationOffsetMinutesFromLocal: Number.NaN };
    expect(() =>
      render(
        <div id="weather_channel">
          <StatsScreen
            city="HAMILTON"
            weatherStationTime={badOffsetTime}
            season={season}
            sunRiseSet={sun}
            hotColdSpots={hotCold}
          />
        </div>
      )
    ).not.toThrow();
  });
});
