jest.mock("fs");
import { initializeConfig } from "lib/config/config";
import fs from "fs";
import exampleConfig from "./testdata/config/exampleConfig.json";
import { DEFAULT_AIRPORT_METAR_STATIONS } from "consts/airportMetar.consts";
import { FLAVOUR_DEFAULT } from "consts/flavour.consts";
import { DEFAULT_WEATHER_STATION_ID } from "consts/server.consts";
import { PROVINCE_TRACKING_DEFAULT_STATIONS } from "consts/provincetracking.consts";
import { FS_NO_FILE_FOUND } from "consts/storage.consts";

const defaultPrimaryLocation = {
  province: "MB",
  location: DEFAULT_WEATHER_STATION_ID,
  name: "Winnipeg",
};

/** Winnipeg primary + MSC bundle so load-time anchor reconciliation is a no-op (tests missing-field merge behaviour). */
const winnipegPrimaryConfig = {
  ...exampleConfig,
  primaryLocation: { province: "MB", location: "s0000193", name: "Winnipeg" },
  historicalDataStationID: 27174,
  climateNormals: { stationID: 3698, climateID: 5023222, province: "MB" },
  misc: { rejectInHourConditionUpdates: true, ltceVirtualClimateId: "VSMB38V" },
};

describe("Config file loading", () => {
  it("loads from file correctly", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => JSON.stringify(exampleConfig));

    const config = initializeConfig();
    expect(config.primaryLocation).toStrictEqual(exampleConfig.primaryLocation);
    expect(config.provinceHighLowEnabled).toStrictEqual(exampleConfig.provinceHighLowEnabled);
    expect(config.provinceStations).toStrictEqual([
      { name: "Toronto", code: "ON/s0000458", climateStationId: 51459 },
      { name: "Ottawa", code: "ON/s0000623" },
      { name: "Hamilton", code: "ON/s0000549", climateStationId: 49908 },
      { name: "London", code: "ON/s0000326" },
      { name: "Kitchener", code: "ON/s0000573" },
      { name: "Windsor", code: "ON/s0000646" },
    ]);
    expect(config.historicalDataStationID).toStrictEqual(exampleConfig.historicalDataStationID);
    expect(config.climateNormals).toStrictEqual(exampleConfig.climateNormals);
    expect(config.lookAndFeel).toStrictEqual({
      font: "vt323",
      flavour: FLAVOUR_DEFAULT.name,
      showFooterFreshnessHint: true,
      useOfficialFonts: true,
    });
    expect(config.misc).toStrictEqual({
      ...exampleConfig.misc,
      alternateRecordsSource: undefined,
      logLevel: "warn",
      /** Toronto primary (`exampleConfig`) — load reconciles Winnipeg-default LTCE to the curated Toronto virtual id. */
      ltceVirtualClimateId: "VSON143",
    });
    expect(config.flavour.name).toStrictEqual(FLAVOUR_DEFAULT.name);
    expect(config.flavour.screens).toStrictEqual(FLAVOUR_DEFAULT.screens);
    expect(config.musicPlaylist).toHaveLength(0);
    expect(config.crawlerMessages).toHaveLength(0);
    expect(config.airportMetarStations).toEqual([...DEFAULT_AIRPORT_METAR_STATIONS]);
  });

  it("reconciles split-brain MSC settings on load when primary is Hamilton", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() =>
      JSON.stringify({
        ...exampleConfig,
        primaryLocation: { province: "ON", location: "s0000549", name: "Hamilton" },
        historicalDataStationID: 27174,
        climateNormals: { stationID: 3698, climateID: 5023222, province: "MB" },
        misc: { rejectInHourConditionUpdates: false, ltceVirtualClimateId: "VSMB38V" },
      })
    );
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    const config = initializeConfig();
    expect(config.historicalDataStationID).toBe(49908);
    expect(config.climateNormals).toStrictEqual({
      climateID: 6153194,
      stationID: 4932,
      province: "ON",
    });
    expect(config.misc.ltceVirtualClimateId).toBe("VSON77V");
  });

  it("uses default airport METAR stations when airportMetarStations is []", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() =>
      JSON.stringify({ ...exampleConfig, airportMetarStations: [] })
    );
    const config = initializeConfig();
    expect(config.airportMetarStations).toEqual([...DEFAULT_AIRPORT_METAR_STATIONS]);
  });

  it("uses default airport METAR stations when every airportMetarStations entry is invalid", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() =>
      JSON.stringify({
        ...exampleConfig,
        airportMetarStations: [{ name: "Bad", code: "X" }, { foo: 1 }],
      })
    );
    const config = initializeConfig();
    expect(config.airportMetarStations).toEqual([...DEFAULT_AIRPORT_METAR_STATIONS]);
  });

  it("loads from file correctly when primary location is missing", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, primaryLocation: undefined }));

    const config = initializeConfig();
    expect(config.primaryLocation).toStrictEqual(defaultPrimaryLocation);
  });

  it("loads from file correctly when provincehighlowenabled is missing", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, provinceHighLowEnabled: undefined }));

    let config = initializeConfig();
    expect(config.provinceHighLowEnabled).toStrictEqual(true);

    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, provinceHighLowEnabled: false }));

    config = initializeConfig();
    expect(config.provinceHighLowEnabled).toStrictEqual(false);
  });

  it("loads from file correctly when historical data station id is missing", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...winnipegPrimaryConfig, historicalDataStationID: undefined }));

    const config = initializeConfig();
    expect(config.historicalDataStationID).toStrictEqual(27174);
  });

  it("loads from file correctly when climate normals is missing", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...winnipegPrimaryConfig, climateNormals: undefined }));

    let config = initializeConfig();
    expect(config.climateNormals).toStrictEqual({
      stationID: 3698,
      climateID: 5023222,
      province: "MB",
    });

    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...winnipegPrimaryConfig, climateNormals: {} }));

    config = initializeConfig();
    expect(config.climateNormals).toStrictEqual({
      stationID: 3698,
      climateID: 5023222,
      province: "MB",
    });
  });

  it("loads from file correctly when climate normals is partially present", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() =>
        JSON.stringify({ ...winnipegPrimaryConfig, climateNormals: { province: "MB" } })
      );

    const config = initializeConfig();
    expect(config.climateNormals).toStrictEqual({
      stationID: 3698,
      climateID: 5023222,
      province: "MB",
    });
  });

  it("loads from file correctly when lookAndFeel is missing", () => {
    const defaultLookAndFeel = {
      font: "vt323",
      flavour: "default",
      showFooterFreshnessHint: true,
      useOfficialFonts: true,
    };
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, lookAndFeel: undefined }));

    let config = initializeConfig();
    expect(config.lookAndFeel).toStrictEqual(defaultLookAndFeel);

    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, lookAndFeel: {} }));

    config = initializeConfig();
    expect(config.lookAndFeel).toStrictEqual(defaultLookAndFeel);
  });

  it("loads from file correctly when misc is missing", () => {
    const defaultMisc: {
      rejectInHourConditionUpdates: boolean;
      alternateRecordsSource?: string;
      logLevel: string;
      ltceVirtualClimateId: string;
    } = {
      rejectInHourConditionUpdates: false,
      alternateRecordsSource: undefined,
      logLevel: "warn",
      ltceVirtualClimateId: "VSMB38V",
    };
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => JSON.stringify({ ...winnipegPrimaryConfig, misc: undefined }));

    let config = initializeConfig();
    expect(config.misc).toStrictEqual(defaultMisc);

    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => JSON.stringify({ ...winnipegPrimaryConfig, misc: {} }));

    config = initializeConfig();
    expect(config.misc).toStrictEqual(defaultMisc);
  });

  it("fills province climateStationId from citypage anchor when omitted (Oakville)", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() =>
      JSON.stringify({
        ...winnipegPrimaryConfig,
        provinceStations: [{ name: "Oakville", code: "ON/s0000367" }],
      })
    );
    const config = initializeConfig();
    expect(config.provinceStations).toStrictEqual([
      { name: "Oakville", code: "ON/s0000367", climateStationId: 7868 },
    ]);
  });

  it("loads from file correctly when provinceStations is missing", () => {
    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, provinceStations: undefined }));

    let config = initializeConfig();
    expect(config.provinceStations).toStrictEqual(PROVINCE_TRACKING_DEFAULT_STATIONS);

    jest
      .spyOn(fs, "readFileSync")
      .mockImplementationOnce(() => JSON.stringify({ ...exampleConfig, provinceStations: [] }));

    config = initializeConfig();
    expect(config.provinceStations).toStrictEqual(PROVINCE_TRACKING_DEFAULT_STATIONS);
  });

  it("handles the config file being corrupted", () => {
    jest.spyOn(fs, "readFileSync").mockReturnValueOnce("this is not json");

    const config = initializeConfig();
    expect(config.config).not.toBeFalsy();
    expect(config.primaryLocation).toStrictEqual(defaultPrimaryLocation);
  });

  it("handles the config file not existing", () => {
    jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
      throw { code: FS_NO_FILE_FOUND };
    });

    const config = initializeConfig();
    expect(config.config).not.toBeFalsy();
    expect(config.primaryLocation).toStrictEqual(defaultPrimaryLocation);
  });

  it("loads crawler messages from file correctly", () => {
    const crawlers = ["crawler 1", "crawler 2", "crawler 3"];
    jest.spyOn(fs, "readFileSync").mockImplementation(() => crawlers.join("\n"));

    const config = initializeConfig();
    expect(config.crawlerMessages).toStrictEqual(crawlers);
  });

  it("loads crawler messages from an empty file correctly", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => "");

    const config = initializeConfig();
    expect(config.crawlerMessages).toStrictEqual([]);
  });

  it("handles the crawler messages file not existing", () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw { code: FS_NO_FILE_FOUND };
    });

    const config = initializeConfig();
    expect(config.crawlerMessages).toStrictEqual([]);
  });
});

describe("Config updating", () => {
  it("updates the primary location correctly", () => {
    const config = initializeConfig();

    const newPrimaryLocation = {
      province: "MB",
      location: DEFAULT_WEATHER_STATION_ID,
      name: "Winnipeg",
    };

    config.setPrimaryLocation(newPrimaryLocation);
    expect(config.primaryLocation).toStrictEqual(newPrimaryLocation);
  });

  it("aligns historical, climate normals, and LTCE when primary is switched to a curated citypage (Hamilton)", () => {
    const config = initializeConfig();
    config.setPrimaryLocation({ province: "ON", location: "s0000549", name: "Hamilton" });
    expect(config.historicalDataStationID).toBe(49908);
    expect(config.climateNormals).toStrictEqual({
      climateID: 6153194,
      stationID: 4932,
      province: "ON",
    });
    expect(config.misc.ltceVirtualClimateId).toBe("VSON77V");
  });

  it("updates the province tracking correcty", () => {
    const config = initializeConfig();

    const newStations = [PROVINCE_TRACKING_DEFAULT_STATIONS[2]];
    config.setProvinceStations(true, newStations);
    expect(config.provinceHighLowEnabled).toBeTruthy();
    expect(config.provinceStations).toStrictEqual(newStations);

    config.setProvinceStations(false, newStations);
    expect(config.provinceHighLowEnabled).toBeFalsy();
    expect(config.provinceStations).toStrictEqual(newStations);

    config.setProvinceStations(true, []);
    expect(config.provinceHighLowEnabled).toBeTruthy();
    expect(config.provinceStations).toStrictEqual(newStations);
  });

  it("updates the historical data station ID correctly", () => {
    const config = initializeConfig();
    const originalID = config.historicalDataStationID;

    config.setHistoricalDataStationID(Number("abc"));
    expect(config.historicalDataStationID).toBe(originalID);

    const newID = 512;
    config.setHistoricalDataStationID(newID);
    expect(config.historicalDataStationID).toBe(newID);
  });

  it("updates the climate normals correctly", () => {
    const config = initializeConfig();
    const climateNormals = config.climateNormals;

    config.setClimateNormals(Number("abc"), Number("abc"), "blah");
    expect(config.climateNormals).toStrictEqual(climateNormals);

    config.setClimateNormals(23, Number("abc"), "blah");
    expect(config.climateNormals).toStrictEqual(climateNormals);

    config.setClimateNormals(23, 45, "blah");
    expect(config.climateNormals).toStrictEqual(climateNormals);

    config.setClimateNormals(23, 45, "on");
    expect(config.climateNormals).toStrictEqual({ climateID: 23, stationID: 45, province: "ON" });
  });

  it("updates the misc settings correctly", () => {
    const config = initializeConfig();
    [
      { reject: true, url: "http://example.com" },
      { reject: false, url: "" },
      { reject: true, url: "" },
      { reject: false, url: "http://exampe.com" },
    ].forEach((update) => {
      config.setMiscSettings(update.reject, update.url);
      expect(config.misc).toStrictEqual({
        rejectInHourConditionUpdates: update.reject,
        alternateRecordsSource: update.url,
        logLevel: "warn",
        ltceVirtualClimateId: "VSMB38V",
      });
    });

    config.setMiscSettings(true, "", "error");
    expect(config.misc.logLevel).toBe("error");

    config.setMiscSettings(false, "", undefined, "");
    expect(config.misc.ltceVirtualClimateId).toBeUndefined();
  });

  it("updates the look and feel settings correctly", () => {
    const config = initializeConfig();
    config.setLookAndFeelSettings({ flavour: "test" });
    expect(config.lookAndFeel.flavour).toStrictEqual("test");

    config.setLookAndFeelSettings({ flavour: "" });
    expect(config.lookAndFeel.flavour).toStrictEqual("default");

    config.setLookAndFeelSettings({ showFooterFreshnessHint: false });
    expect(config.lookAndFeel.showFooterFreshnessHint).toStrictEqual(false);

    config.setLookAndFeelSettings({ useOfficialFonts: false });
    expect(config.lookAndFeel.useOfficialFonts).toStrictEqual(false);
  });

  it("updates and saves the config option correctly", () => {
    const config = initializeConfig();
    const writeFile = jest.spyOn(fs, "writeFileSync").mockImplementation();

    const newLocation = {
      province: "ON",
      location: "s00001",
      name: "Some ON town",
    };
    const fn = jest.fn(() => config.setPrimaryLocation(newLocation));
    config.updateAndSaveConfigOption(fn);

    expect(writeFile).toHaveBeenCalled();
    expect(fn).toHaveBeenCalled();
    expect(config.primaryLocation).toStrictEqual(newLocation);
  });

  it("updates the crawler messages correctly", () => {
    const config = initializeConfig();
    const writeFile = jest.spyOn(fs, "writeFileSync").mockImplementation();

    const newCrawlerMessages = ["a crawler", "and another one", "and a third one"];
    config.setCrawlerMessages(newCrawlerMessages);
    expect(config.crawlerMessages).toStrictEqual(newCrawlerMessages);

    config.setCrawlerMessages([...newCrawlerMessages, "   ", ""]);
    expect(config.crawlerMessages).toStrictEqual(newCrawlerMessages);
    expect(writeFile).toHaveBeenCalled();
  });

  it("updates the air quality station settings correctly", () => {
    const config = initializeConfig();
    config.setAirQualityStation("ont/abcd");
    expect(config.airQualityStation).toStrictEqual("ont/abcd");

    config.setAirQualityStation("");
    expect(config.airQualityStation).toBeFalsy();
  });
});
