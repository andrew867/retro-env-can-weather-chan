import fs from "fs";
import uuid4 from "uuid4";
import {
  AIR_QUALITY_DEFAULT_STATION,
  DEFAULT_WEATHER_STATION_ID,
  EVENT_BUS_CONFIG_CHANGE_AIR_QUALITY_STATION,
  EVENT_BUS_CONFIG_CHANGE_CLIMATE_NORMALS,
  EVENT_BUS_CONFIG_CHANGE_HISTORICAL_TEMP_PRECIP,
  EVENT_BUS_CONFIG_CHANGE_PRIMARY_LOCATION,
  EVENT_BUS_CONFIG_CHANGE_PROVINCE_TRACKING,
  FLAVOUR_DIRECTORY,
  FS_NO_FILE_FOUND,
  PROVINCE_TRACKING_DEFAULT_STATIONS,
} from "consts";
import { FlavourLoader } from "lib/flavour";
import Logger from "lib/logger";
import {
  ClimateNormals,
  ECCCWeatherStation,
  Flavour,
  LookAndFeel,
  MiscConfig,
  PrimaryLocation,
  ProvinceStation,
  ProvinceStations,
} from "types";
import eventbus from "lib/eventbus";

const logger = new Logger("config");
const CONFIG_PATH = {
  FOLDER: "./cfg",
  FILE: "rwc-config.json",
};
const CONFIG_ABSOLUTE_PATH = `${CONFIG_PATH.FOLDER}/${CONFIG_PATH.FILE}`;
const BAD_CONFIG_FILE_ERROR_MESSAGE = "Unable to load config file, defaults have been loaded";

import { initializeCrawler } from "lib/crawler";

const MUSIC_DIR = "music";

class Config {
  primaryLocation: PrimaryLocation = {
    province: "MB",
    location: DEFAULT_WEATHER_STATION_ID,
    name: "Winnipeg",
  };
  provinceHighLowEnabled = true; // eventually you can choose what cities this tracks but for now this is true/false
  historicalDataStationID = 27174; // (used for last year temps + precip data) winnipeg a cs
  climateNormals: ClimateNormals = {
    stationID: 3698, // winnipeg richardson a (used for climate normals on last month summary)
    climateID: 5023222, // (used for climate normals on last month summary)
    province: "MB",
  };
  lookAndFeel: LookAndFeel = { font: "vt323", flavour: "default" };
  misc: MiscConfig = {
    rejectInHourConditionUpdates: false, // whether we should only update conditions once an hour
    alternateRecordsSource: undefined, // if you want to supply your own record data to override what ECCC has, you can do it here with a JSON file at http(s)://example.com/records.json
  };
  crawlerMessages: string[] = [];
  musicPlaylist: string[] = []; // what music files are available
  flavour: Flavour;
  flavours: string[] = []; // what flavours are available
  provinceStations: ProvinceStation[]; // what provinces to track high/low/precip for
  airQualityStation: string; // what area/station code to use for air quality
  configVersion: string; // config version

  constructor() {
    this.loadConfig();
    this.checkFlavoursDirectory();
    this.loadFlavour();
    this.loadCrawlerMessages();
    this.checkMusicDirectory();
    this.generateConfigVersion();
  }

  get config() {
    return {
      primaryLocation: this.primaryLocation,
      provinceHighLowEnabled: this.provinceHighLowEnabled,
      provinceStations: this.provinceStations,
      historicalDataStationID: this.historicalDataStationID,
      climateNormals: this.climateNormals,
      lookAndFeel: this.lookAndFeel,
      misc: this.misc,
      flavour: this.flavour,
      flavours: this.flavours,
      airQualityStation: this.airQualityStation,
      crawler: this.crawlerMessages,
      music: this.musicPlaylist ?? [],
    };
  }

  get configWithoutFlavour() {
    const config = { ...this.config };
    delete config.flavour;
    delete config.flavours;
    delete config.crawler;
    return config;
  }

  private loadConfig() {
    logger.log("Loading config file", `(${CONFIG_ABSOLUTE_PATH})`, "...");

    // attempt to the read the file
    try {
      const data = fs.readFileSync(CONFIG_ABSOLUTE_PATH, "utf8");

      // parse the json from the config file
      const parsedConfig = JSON.parse(data);
      if (!parsedConfig) throw "Bad config data";

      // now assign our values from what we had in the config file
      const {
        primaryLocation,
        primaryLocation: { name, province, location },
        provinceHighLowEnabled,
        historicalDataStationID,
        climateNormals,
        lookAndFeel,
        misc,
        provinceStations,
        airQualityStation,
      } = parsedConfig;

      // but first we make sure that we have at least the province info
      if (!location?.length || !province?.length) throw "Bad primary location data";

      // now we just copy our config file over to our class (with fallbacks to the original)
      this.primaryLocation = primaryLocation ?? this.primaryLocation;
      this.provinceHighLowEnabled = provinceHighLowEnabled ?? this.provinceHighLowEnabled;
      this.historicalDataStationID = historicalDataStationID ?? this.historicalDataStationID;
      this.climateNormals = { ...this.climateNormals, ...climateNormals };
      this.lookAndFeel = { ...this.lookAndFeel, ...lookAndFeel };
      this.misc = { ...this.misc, ...misc };
      this.provinceStations =
        provinceHighLowEnabled && provinceStations?.length ? provinceStations : PROVINCE_TRACKING_DEFAULT_STATIONS;
      this.airQualityStation = airQualityStation ?? AIR_QUALITY_DEFAULT_STATION;

      logger.log("Loaded weather channel. Location:", `${name}, ${province}`, `(${location})`);
    } catch (err) {
      if (err.code === FS_NO_FILE_FOUND) {
        // handle no file found
        logger.error("No config fle found, loading defaults");
        logger.error("Configuration can be set via http://localhost:8600/#/config");
      } else {
        // handle any other error
        logger.error(BAD_CONFIG_FILE_ERROR_MESSAGE);
      }
    }
  }

  private loadFlavour() {
    logger.log("Loading flavour (screen rotation)", this.lookAndFeel.flavour);

    this.flavour = new FlavourLoader(this.lookAndFeel.flavour);
    if (!this.flavour) logger.error("Unable to load flavour, please check your config");
  }

  private loadCrawlerMessages() {
    logger.log("Loading crawler messages");
    try {
      const crawler = initializeCrawler();
      this.crawlerMessages = crawler.messages;
      logger.log("Loaded", this.crawlerMessages.length, "crawler messages");
    } catch (err) {
      logger.error("Unable to call crawler load");
    }
  }

  private saveCrawlerMessages() {
    logger.log("Saving crawler messages");
    try {
      const crawler = initializeCrawler();
      crawler.messages = this.crawlerMessages;
      logger.log("Saved", crawler.messages.length, "crawler messages");
    } catch (err) {
      logger.error("Unable to call crawler save");
    }
  }

  private checkMusicDirectory() {
    logger.log("Loading playlist from", MUSIC_DIR);

    fs.readdir(MUSIC_DIR, (err, files) => this.handleMusicDirectoryResponse(err, files));
  }

  private async checkMusicDirectoryBlocking() {
    logger.log("Loading playlist from", MUSIC_DIR);

    try {
      const files = await fs.readdirSync(MUSIC_DIR);
      this.handleMusicDirectoryResponse(undefined, files);
    } catch (e) {
      logger.error("Failed to generate playlist");
    }
  }

  private handleMusicDirectoryResponse(err: NodeJS.ErrnoException, files: string[]) {
    if (err) logger.error("Failed to generate playlist");
    else {
      this.musicPlaylist.splice(
        0,
        this.musicPlaylist.length,
        ...files.filter((f) => f.endsWith(".mp3")).map((f) => `${MUSIC_DIR}/${f}`)
      );
      logger.log("Generated playlist of", this.musicPlaylist.length, "files");
    }
  }

  private checkFlavoursDirectory() {
    logger.log("Checking available flavours from", FLAVOUR_DIRECTORY);

    fs.readdir(FLAVOUR_DIRECTORY, (err, files) => {
      if (err) logger.error("Failed to retrieve available flavours");
      else {
        this.flavours.splice(
          0,
          this.flavours.length,
          ...files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""))
        );
        logger.log("Found", this.flavours.length, "available flavours");
      }
    });
  }

  private saveConfig() {
    logger.log("Saving config file", `(${CONFIG_ABSOLUTE_PATH})`, "...");

    try {
      fs.writeFileSync(CONFIG_ABSOLUTE_PATH, JSON.stringify(this.configWithoutFlavour), "utf8");
      logger.log("Config file saved successfully");
    } catch (err) {
      logger.error("Failed to save config file");
    }
  }

  private generateConfigVersion() {
    this.configVersion = uuid4();
  }

  public updateAndSaveConfigOption(updateFunc: () => void) {
    updateFunc();
    this.generateConfigVersion();
    this.saveConfig();
  }

  public setPrimaryLocation(station: ECCCWeatherStation) {
    if (!station) return;

    this.primaryLocation = station;

    eventbus.emit(EVENT_BUS_CONFIG_CHANGE_PRIMARY_LOCATION, true);
  }

  public setProvinceStations(isEnabled: boolean, stations: ProvinceStations) {
    this.provinceHighLowEnabled = isEnabled;
    if (stations?.length) this.provinceStations = stations;

    eventbus.emit(EVENT_BUS_CONFIG_CHANGE_PROVINCE_TRACKING, true);
  }

  public setHistoricalDataStationID(id: number) {
    if (!id || isNaN(id)) return;

    this.historicalDataStationID = id;
    eventbus.emit(EVENT_BUS_CONFIG_CHANGE_HISTORICAL_TEMP_PRECIP, true);
  }

  public setClimateNormals(climateID: number, stationID: number, province: string) {
    if (!climateID || isNaN(climateID)) return;
    if (!stationID || isNaN(stationID)) return;
    if (!province.length || province.length > 2 || typeof province !== "string") return;

    this.climateNormals = {
      ...this.climateNormals,
      climateID,
      stationID,
      province: province.toUpperCase(),
    };

    eventbus.emit(EVENT_BUS_CONFIG_CHANGE_CLIMATE_NORMALS, true);
  }

  public regenerateAvailableFlavours() {
    this.checkFlavoursDirectory();
  }

  public setMiscSettings(rejectInHourConditionUpdates: boolean, alternateRecordsSource: string) {
    this.misc.alternateRecordsSource = alternateRecordsSource;
    this.misc.rejectInHourConditionUpdates = rejectInHourConditionUpdates;
  }

  public setLookAndFeelSettings(flavour: string) {
    if (!flavour) this.lookAndFeel.flavour = "default";
    else this.lookAndFeel.flavour = flavour;

    this.loadFlavour();
  }

  public setAirQualityStation(station: string) {
    this.airQualityStation = station;

    eventbus.emit(EVENT_BUS_CONFIG_CHANGE_AIR_QUALITY_STATION, true);
  }

  public setCrawlerMessages(crawler: string[]) {
    this.crawlerMessages.splice(
      0,
      this.crawlerMessages.length,
      ...crawler.map((message) => message.trim()).filter((message) => message.length)
    );
    this.saveCrawlerMessages();
  }

  public async regeneratePlaylist() {
    await this.checkMusicDirectoryBlocking();
  }
}

let config: Config = null;
export function initializeConfig(): Config {
  if (process.env.NODE_ENV === "test") return new Config();
  if (config) return config;

  config = new Config();
  return config;
}
