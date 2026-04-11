jest.mock("lib/eccc/citypageLatLon", () => ({
  fetchCitypageLatLon: jest.fn(async () => ({ lat: 43.7, long: -79.4 })),
}));

jest.mock("lib/backendAxios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import backendAxios from "lib/backendAxios";
import { resolveLocationFeedSuggestions } from "lib/eccc/mscLocationFeedResolve";
import type { ECCCWeatherStation } from "types";

describe("mscLocationFeedResolve", () => {
  const station: ECCCWeatherStation = { name: "Toronto", province: "ON", location: "s0000458" };

  beforeEach(() => {
    (backendAxios.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes("/collections/climate-stations/")) {
        return {
          data: {
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [-79.4, 43.67] },
                properties: {
                  STN_ID: 5051,
                  CLIMATE_IDENTIFIER: "6158350",
                  STATION_NAME: "TORONTO",
                  HAS_HOURLY_DATA: "Y",
                  HAS_NORMALS_DATA: "Y",
                  NORMAL_CODE: "A",
                },
              },
            ],
          },
        };
      }
      if (url.includes("/collections/ltce-stations/")) {
        return {
          data: {
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [-79.38, 43.74] },
                properties: { VIRTUAL_CLIMATE_ID: "VSON143", VIRTUAL_STATION_NAME_E: "TORONTO AREA" },
              },
            ],
          },
        };
      }
      if (url.includes("/collections/aqhi-stations/")) {
        return {
          data: {
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [-79.37, 43.74] },
                properties: {
                  "eccc_administrative-zone": "ont",
                  location_id: "FEUZB",
                  location_name_en: "Toronto",
                },
              },
            ],
          },
        };
      }
      if (url.includes("/collections/swob-stations/")) {
        return {
          data: {
            features: [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [-79.63, 43.68] },
                properties: { iata_id: "CYYZ", name: "Toronto/Pearson International" },
              },
            ],
          },
        };
      }
      throw new Error(`unexpected url ${url}`);
    });
  });

  it("resolveLocationFeedSuggestions merges mocked OGC collections", async () => {
    const s = await resolveLocationFeedSuggestions(station, {
      dynamicClimateAndLtce: true,
      aqhi: true,
      metar: true,
      metarHeuristic: "nearest",
      hasCuratedAnchor: false,
    });

    expect(s.citypageLatLon).toEqual({ lat: 43.7, long: -79.4 });
    expect(s.climate?.historicalDataStationID).toBe(5051);
    expect(s.climate?.climateNormalsClimateID).toBe(6158350);
    expect(s.ltce?.virtualClimateId).toBe("VSON143");
    expect(s.aqhi?.stationKey).toBe("ont/FEUZB");
    expect(s.airportMetar.some((m) => m.code === "CYYZ")).toBe(true);
  });

  it("skips climate/LTCE when hasCuratedAnchor is true", async () => {
    const s = await resolveLocationFeedSuggestions(station, {
      dynamicClimateAndLtce: true,
      aqhi: true,
      metar: false,
      metarHeuristic: "nearest",
      hasCuratedAnchor: true,
    });
    expect(s.climate).toBeNull();
    expect(s.ltce).toBeNull();
    expect(s.aqhi?.stationKey).toBe("ont/FEUZB");
  });
});
