import { Screens } from "consts";
import { buildChannelPlaylist } from "lib/display/channelPlaylist";
import type { FlavourScreen } from "types";

/** Minimal station so FORECAST and OUTLOOK can expand (playlist not empty when those screens are used). */
function readyStation(): import("types").WeatherStation {
  return {
    observationID: "test-obs",
    city: "Winnipeg",
    stationID: "s0000193",
    fetchedAt: "2026-04-08T12:00:00.000Z",
    stationTime: {
      observedDateTime: "2026-04-08T12:00:00.000Z",
      stationOffsetMinutesFromLocal: -300,
      timezone: "CDT",
    },
    observed: {
      condition: "Cloudy",
      abbreviatedCondition: "Cloudy",
      temperature: { value: 0, unit: "C" },
      pressure: { value: 100, unit: "kPa", change: 0, tendency: "steady" },
      humidity: { value: 50, unit: "%" },
      visibility: { value: 10, unit: "km" },
      wind: { speed: { value: 10, unit: "km/h" }, gust: { value: 0, unit: "km/h" }, direction: "N" },
      windchill: 0,
    },
    almanac: {
      temperatures: {
        extremeMin: { value: -40, unit: "C", year: 1999 },
        extremeMax: { value: 35, unit: "C", year: 1988 },
        normalMin: { value: -4, unit: "C" },
        normalMax: { value: 8, unit: "C" },
        lastYearMin: { value: -5, unit: "C" },
        lastYearMax: { value: 2, unit: "C" },
      },
      sunRiseSet: { rise: "07:00", set: "20:00", timezone: "CDT" },
    },
    forecast: [
      { period: "Today", abbreviatedTextSummary: "Light snow.", temperature: { value: 0, class: "low" } },
      { period: "Wednesday", abbreviatedTextSummary: "Sun.", temperature: { value: 1, class: "high" } },
      { period: "Wednesday night", abbreviatedTextSummary: "Clear.", temperature: { value: -2, class: "low" } },
      { period: "Thursday", abbreviatedTextSummary: "Cloudy.", temperature: { value: 3, class: "high" } },
      { period: "Thursday night", abbreviatedTextSummary: "Cloudy.", temperature: { value: -1, class: "low" } },
      { period: "Friday", abbreviatedTextSummary: "Sun.", temperature: { value: 5, class: "high" } },
      { period: "Friday night", abbreviatedTextSummary: "Clear.", temperature: { value: 0, class: "low" } },
    ],
  } as unknown as import("types").WeatherStation;
}

describe("buildChannelPlaylist — one entry per flavour screen type", () => {
  const allScreenIds = Object.values(Screens).filter((v) => typeof v === "number") as Screens[];

  it("covers every Screens enum value (add handling in ScreenRotator + tests when adding a screen)", () => {
    expect(allScreenIds.length).toBeGreaterThan(0);
    expect(new Set(allScreenIds).size).toBe(allScreenIds.length);
  });

  it.each(allScreenIds)("screen %i produces a non-empty playlist when data supports it", (screenId) => {
    const screens: FlavourScreen[] = [{ id: screenId, duration: 14 }];
    const ctx = { weatherStationResponse: readyStation(), alert: undefined };
    const pl = buildChannelPlaylist(screens, ctx);
    expect(pl.length).toBeGreaterThan(0);
    if (screenId === Screens.FORECAST) {
      expect(pl.every((e) => e.kind === "forecast_page")).toBe(true);
    } else if (screenId === Screens.OUTLOOK) {
      expect(pl.every((e) => e.kind === "outlook_page")).toBe(true);
    } else {
      expect(pl).toEqual([{ kind: "timed", screen: screens[0] }]);
    }
  });

  it("OUTLOOK yields no slots until forecast + observed time exist", () => {
    const screens: FlavourScreen[] = [{ id: Screens.OUTLOOK, duration: 14 }];
    const pl = buildChannelPlaylist(screens, {
      weatherStationResponse: { forecast: [], stationTime: undefined } as import("types").WeatherStation,
      alert: undefined,
    });
    expect(pl).toHaveLength(0);
  });
});
