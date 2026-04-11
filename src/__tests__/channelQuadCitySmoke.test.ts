import { Screens } from "consts";
import { buildChannelPlaylist } from "lib/display/channelPlaylist";
import { buildForecastScreenBodies } from "lib/display/forecastScreenBodies";
import { buildOutlookScreenBodies } from "lib/display/outlookScreenBodies";
import type { WeatherStation } from "types";
import wpg from "./testdata/ecccData/conditions/s0000193_e.json";
import oak from "./testdata/ecccData/conditions/s0000367_e.json";
import ham from "./testdata/ecccData/conditions/s0000549_e.json";
import stj from "./testdata/ecccData/conditions/s0000280_nl_e.json";

const timed = (id: Screens) => ({ id, duration: 12 as const });

describe("quad-city fixture smoke (no live MSC)", () => {
  const stations: WeatherStation[] = [wpg, oak, ham, stj] as unknown as WeatherStation[];

  it.each(stations.map((ws, i) => [i, ws.city ?? ws.stationID, ws] as const))(
    "station %# %s: forecast + outlook + playlist expand without throw",
    (_, __, ws) => {
      expect(() => buildForecastScreenBodies(ws, undefined)).not.toThrow();
      const fc = buildForecastScreenBodies(ws, undefined);
      expect(fc.length).toBeGreaterThanOrEqual(1);

      expect(() => buildOutlookScreenBodies(ws)).not.toThrow();
      const ol = buildOutlookScreenBodies(ws);
      expect(ol.length).toBeGreaterThanOrEqual(0);

      const screens = [timed(Screens.FORECAST), timed(Screens.OUTLOOK), timed(Screens.STATS)];
      expect(() => buildChannelPlaylist(screens, { weatherStationResponse: ws, alert: undefined })).not.toThrow();
      const pl = buildChannelPlaylist(screens, { weatherStationResponse: ws, alert: undefined });
      expect(pl.length).toBeGreaterThan(0);
    }
  );
});
