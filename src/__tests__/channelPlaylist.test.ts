import { Screens } from "consts";
import {
  buildChannelPlaylist,
  getChannelPlaylistStructureKey,
  type ChannelPlaylistEntry,
} from "lib/display/channelPlaylist";
import { buildForecastScreenBodies } from "lib/display/forecastScreenBodies";
import type { FlavourScreen } from "types";

const timed = (id: Screens): FlavourScreen => ({ id, duration: 10 });

describe("buildChannelPlaylist", () => {
  it("expands FORECAST into one slot per precomputed page", () => {
    const screens: FlavourScreen[] = [timed(Screens.OUTLOOK), timed(Screens.FORECAST), timed(Screens.STATS)];
    const station = {
      forecast: [
        {
          period: "Today",
          abbreviatedTextSummary: "Sun",
        },
      ],
    } as unknown as import("types").WeatherStation;

    const playlist = buildChannelPlaylist(screens, { weatherStationResponse: station, alert: undefined });
    const bodies = buildForecastScreenBodies(station, undefined);
    expect(bodies.length).toBeGreaterThanOrEqual(1);
    const forecastEntries = playlist.filter((e) => e.kind === "forecast_page");
    expect(forecastEntries).toHaveLength(bodies.length);
    expect(forecastEntries[0].pageIndex).toBe(0);
    expect(forecastEntries[forecastEntries.length - 1].pageIndex).toBe(bodies.length - 1);
    /** Outlook is omitted until station time + outlook lines are available (no “No outlook” flash). */
    expect(playlist[0].kind).toBe("forecast_page");
    expect(playlist[playlist.length - 1].kind).toBe("timed");
  });

  it("inserts a single forecast step when there is no forecast text (immediate onComplete)", () => {
    const screens: FlavourScreen[] = [timed(Screens.FORECAST)];
    const station = { forecast: [] } as unknown as import("types").WeatherStation;
    const playlist = buildChannelPlaylist(screens, { weatherStationResponse: station, alert: undefined });
    expect(playlist).toHaveLength(1);
    expect(playlist[0].kind).toBe("forecast_page");
    if (playlist[0].kind === "forecast_page") {
      expect(playlist[0].bodies).toHaveLength(0);
      expect(playlist[0].pageIndex).toBe(0);
    }
  });

  it("getChannelPlaylistStructureKey differs when forecast slot count or page indices differ", () => {
    const screen = timed(Screens.FORECAST);
    const onePage: ChannelPlaylistEntry[] = [{ kind: "forecast_page", screen, bodies: ["a"], pageIndex: 0 }];
    const twoPages: ChannelPlaylistEntry[] = [
      { kind: "forecast_page", screen, bodies: ["a", "b"], pageIndex: 0 },
      { kind: "forecast_page", screen, bodies: ["a", "b"], pageIndex: 1 },
    ];
    expect(getChannelPlaylistStructureKey(onePage)).toBe("F1.0");
    expect(getChannelPlaylistStructureKey(twoPages)).toBe("F2.0>F2.1");
    expect(getChannelPlaylistStructureKey(onePage)).not.toBe(getChannelPlaylistStructureKey(twoPages));
  });

  it("omits OUTLOOK until forecast + station time exist (no empty outlook step)", () => {
    const screens: FlavourScreen[] = [timed(Screens.OUTLOOK)];
    const station = {} as import("types").WeatherStation;
    const playlist = buildChannelPlaylist(screens, { weatherStationResponse: station, alert: undefined });
    expect(playlist.filter((e) => e.kind === "outlook_page")).toHaveLength(0);
  });

  it("expands OUTLOOK into a single outlook_page when data is ready", () => {
    const screens: FlavourScreen[] = [timed(Screens.OUTLOOK)];
    const station = {
      stationID: "s0000193",
      city: "Winnipeg",
      stationTime: { observedDateTime: "2026-04-08T11:00:00.000Z", stationOffsetMinutesFromLocal: -300, timezone: "CDT" },
      forecast: [
        { period: "Wednesday", temperature: { value: 1 }, conditions: "Snow" },
        { period: "Wednesday night", temperature: { value: -2 }, conditions: "Snow" },
        { period: "Thursday", temperature: { value: 2 }, conditions: "Cloudy" },
        { period: "Thursday night", temperature: { value: -1 }, conditions: "Cloudy" },
        { period: "Friday", temperature: { value: 5 }, conditions: "Sun" },
        { period: "Friday night", temperature: { value: 0 }, conditions: "Clear" },
      ],
      almanac: {
        temperatures: {
          normalMin: { value: -3, unit: "C" },
          normalMax: { value: 8, unit: "C" },
        },
      },
    } as unknown as import("types").WeatherStation;
    const playlist = buildChannelPlaylist(screens, { weatherStationResponse: station, alert: undefined });
    const outlookEntries = playlist.filter((e) => e.kind === "outlook_page");
    expect(outlookEntries.length).toBeGreaterThanOrEqual(1);
    expect(outlookEntries[0].pageIndex).toBe(0);
    expect(getChannelPlaylistStructureKey(playlist).startsWith("O")).toBe(true);
  });
});
