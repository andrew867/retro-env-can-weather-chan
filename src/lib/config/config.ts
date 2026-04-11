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
  DEFAULT_AIRPORT_METAR_STATIONS,
  MAX_AIRPORT_METAR_STATIONS,
  PROVINCE_TRACKING_DEFAULT_STATIONS,
  GFX_DEFAULT_SCANLINES_OPACITY,
  GFX_DEFAULT_VHS_HEAD_SWITCH_TEAR_OPACITY,
  GFX_RELOAD_LINE_MS_DEFAULT,
  GFX_RELOAD_LINE_MS_MAX,
  GFX_RELOAD_LINE_MS_MIN,
} from "consts";
import { FlavourLoader } from "lib/flavour";
import Logger, { normalizeLogLevel, setLogLevel } from "lib/logger";
import {
  AirportMetarStation,
  AuthenticRefreshConfig,
  ClimateNormals,
  ECCCWeatherStation,
  Flavour,
  GfxDisplayAspectRatio,
  GfxDisplayResolution,
  GfxRuntimeConfig,
  LookAndFeel,
  MiscConfig,
  PrimaryLocation,
  ProvinceStation,
  ProvinceStations,
} from "types";
import eventbus from "lib/eventbus";
import { LTCE_WINNIPEG_AREA_VIRTUAL_CLIMATE_ID } from "lib/eccc/ltceDailyTemperatureRecords";
import { logConfigValidationIssues, validateLoadedConfigJson } from "lib/config/configValidation";

const logger = new Logger("config");

function normalizeProvinceStationCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

/** Apply known `climateStationId` defaults when JSON config omits them (same `code` as shipped Manitoba list). */
function mergeProvinceStationClimateDefaults(stations: ProvinceStation[]): ProvinceStation[] {
  const defaultsByCode = new Map(
    PROVINCE_TRACKING_DEFAULT_STATIONS.map((s) => [normalizeProvinceStationCode(s.code), s.climateStationId])
  );
  return stations.map((row) => {
    if (typeof row.climateStationId === "number" && Number.isFinite(row.climateStationId)) {
      return row;
    }
    const id = defaultsByCode.get(normalizeProvinceStationCode(row.code));
    if (typeof id === "number" && Number.isFinite(id)) {
      return { ...row, climateStationId: id };
    }
    return row;
  });
}

const CONFIG_PATH = {
  FOLDER: "./cfg",
  FILE: "rwc-config.json",
};
const CONFIG_ABSOLUTE_PATH = `${CONFIG_PATH.FOLDER}/${CONFIG_PATH.FILE}`;
const BAD_CONFIG_FILE_ERROR_MESSAGE = "Unable to load config file, defaults have been loaded";

const CRAWLER_PATH = {
  FOLDER: "./cfg",
  FILE: "crawler.txt",
};
const CRAWLER_ABSOLUTE_PATH = `${CRAWLER_PATH.FOLDER}/${CRAWLER_PATH.FILE}`;
const MUSIC_DIR = "music";

/** On-air preset: serial-style forecast reveal + SD 4:3 + light scanline/VHS polish (see OPERATORS.md). */
const DEFAULT_AUTHENTIC_REFRESH: AuthenticRefreshConfig = {
  enabled: true,
  charsPerSecond: 100,
  jitterMsPerCharMax: 12,
  continuationGraphemeReveal: true,
  respectReducedMotion: true,
  streamUnit: "grapheme",
};

const DEFAULT_GFX: GfxRuntimeConfig = {
  displayAspectRatio: "4:3",
  displayResolution: "sd",
  features: {
    authenticRefreshEnabled: true,
    nextGenVisualLayersEnabled: true,
  },
  safeArea: { top: 0.02, bottom: 0.06, left: 0.02, right: 0.02 },
  retro: {
    scanlinesOpacity: GFX_DEFAULT_SCANLINES_OPACITY,
    phosphorTint: "none",
    vignetteStrength: 0.12,
    vhsAnalogLayerEnabled: true,
    vhsHeadSwitchTearEnabled: false,
    vhsHeadSwitchTearOpacity: GFX_DEFAULT_VHS_HEAD_SWITCH_TEAR_OPACITY,
    reloadLineMs: GFX_RELOAD_LINE_MS_DEFAULT,
  },
};

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
  lookAndFeel: LookAndFeel = {
    font: "vt323",
    flavour: "default",
    showFooterFreshnessHint: true,
    useOfficialFonts: true,
  };
  misc: MiscConfig = {
    rejectInHourConditionUpdates: false, // whether we should only update conditions once an hour
    alternateRecordsSource: undefined, // if you want to supply your own record data to override what ECCC has, you can do it here with a JSON file at http(s)://example.com/records.json
    /** Default Winnipeg Area LTCE id — citypage no longer includes `<almanac>` (MSC 2024-06-25). */
    ltceVirtualClimateId: LTCE_WINNIPEG_AREA_VIRTUAL_CLIMATE_ID,
    logLevel: "warn", // mute notice/debug by default; emit warn/error/critical
  };
  crawlerMessages: string[] = [];
  musicPlaylist: string[] = []; // what music files are available
  /** Lines shown when flavour includes `Screens.INFO` (`infoScreen` in rwc-config.json). */
  infoScreenLines: string[] = [];
  flavour: Flavour;
  flavours: string[] = []; // what flavours are available
  provinceStations: ProvinceStation[]; // what provinces to track high/low/precip for
  airQualityStation: string; // what area/station code to use for air quality
  /** ICAO list for {@link Screens.AIRPORT_METAR} (max {@link MAX_AIRPORT_METAR_STATIONS}). */
  airportMetarStations: AirportMetarStation[];
  configVersion: string; // config version
  gfx: GfxRuntimeConfig = {
    ...DEFAULT_GFX,
    features: { ...DEFAULT_GFX.features },
    safeArea: { ...DEFAULT_GFX.safeArea },
    retro: { ...DEFAULT_GFX.retro },
  };

  authenticRefresh: AuthenticRefreshConfig = { ...DEFAULT_AUTHENTIC_REFRESH };

  constructor() {
    this.airportMetarStations = [];
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
      airportMetarStations: this.airportMetarStations,
      crawler: this.crawlerMessages,
      music: this.musicPlaylist ?? [],
      gfx: this.gfx,
      authenticRefresh: this.authenticRefresh,
      infoScreen: this.infoScreenLines,
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
        gfx,
        authenticRefresh,
        infoScreen,
        airportMetarStations,
      } = parsedConfig;

      // but first we make sure that we have at least the province info
      if (!location?.length || !province?.length) throw "Bad primary location data";

      // now we just copy our config file over to our class (with fallbacks to the original)
      this.primaryLocation = primaryLocation ?? this.primaryLocation;
      this.provinceHighLowEnabled = provinceHighLowEnabled ?? this.provinceHighLowEnabled;
      this.historicalDataStationID = historicalDataStationID ?? this.historicalDataStationID;
      this.climateNormals = { ...this.climateNormals, ...climateNormals };
      this.lookAndFeel = { ...this.lookAndFeel, ...lookAndFeel };
      if (this.lookAndFeel.showFooterFreshnessHint === undefined) this.lookAndFeel.showFooterFreshnessHint = true;
      if (this.lookAndFeel.useOfficialFonts === undefined) this.lookAndFeel.useOfficialFonts = true;
      this.misc = { ...this.misc, ...misc };
      this.misc.logLevel = normalizeLogLevel(this.misc.logLevel, "warn");
      setLogLevel(this.misc.logLevel);
      const rawProvinceStations =
        provinceHighLowEnabled && provinceStations?.length ? provinceStations : PROVINCE_TRACKING_DEFAULT_STATIONS;
      this.provinceStations = mergeProvinceStationClimateDefaults(rawProvinceStations);
      this.airQualityStation = airQualityStation ?? AIR_QUALITY_DEFAULT_STATION;

      if (gfx && typeof gfx === "object") {
        this.gfx = {
          displayAspectRatio: this.normalizeDisplayAspectRatio(gfx.displayAspectRatio),
          displayResolution: this.normalizeDisplayResolution(gfx.displayResolution),
          features: { ...DEFAULT_GFX.features, ...(gfx.features ?? {}) },
          safeArea: { ...DEFAULT_GFX.safeArea, ...(gfx.safeArea ?? {}) },
          retro: { ...DEFAULT_GFX.retro, ...(gfx.retro ?? {}) },
        };
        this.clampGfxRetro(this.gfx.retro);
      }

      if (authenticRefresh && typeof authenticRefresh === "object") {
        this.authenticRefresh = this.normalizeAuthenticRefresh({ ...this.authenticRefresh, ...authenticRefresh });
      }

      if (Array.isArray(infoScreen)) {
        this.infoScreenLines = infoScreen.filter((line): line is string => typeof line === "string");
      }

      if (Array.isArray(airportMetarStations)) {
        this.airportMetarStations = airportMetarStations
          .filter(
            (row: unknown): row is { name?: unknown; code?: unknown } =>
              row != null && typeof row === "object" && "code" in row
          )
          .map((row) => {
            const code = typeof row.code === "string" ? row.code.trim().toUpperCase() : "";
            const name =
              typeof row.name === "string" && row.name.trim().length ? row.name.trim() : code || "Unknown";
            return { name, code };
          })
          .filter((row) => /^[A-Z0-9]{3,4}$/.test(row.code))
          .slice(0, MAX_AIRPORT_METAR_STATIONS);
      } else {
        this.airportMetarStations = DEFAULT_AIRPORT_METAR_STATIONS.map((row) => ({ ...row }));
      }
      if (this.gfx?.features?.authenticRefreshEnabled) {
        this.authenticRefresh = this.normalizeAuthenticRefresh({
          ...this.authenticRefresh,
          enabled: true,
        });
      }

      logConfigValidationIssues(validateLoadedConfigJson(parsedConfig as Record<string, unknown>));

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
    this.ensureAirportMetarStationsNotEmpty();
  }

  /** Empty array, all-invalid entries, or failed parse would leave METAR polling idle — use defaults. */
  private ensureAirportMetarStationsNotEmpty() {
    if (this.airportMetarStations?.length) return;
    this.airportMetarStations = DEFAULT_AIRPORT_METAR_STATIONS.map((row) => ({ ...row }));
    logger.log("airportMetarStations was empty; using DEFAULT_AIRPORT_METAR_STATIONS");
  }

  private loadFlavour() {
    logger.log("Loading flavour (screen rotation)", this.lookAndFeel.flavour);

    this.flavour = new FlavourLoader(this.lookAndFeel.flavour);
    if (!this.flavour) logger.error("Unable to load flavour, please check your config");
  }

  private loadCrawlerMessages() {
    logger.log("Loading crawler messages from", CRAWLER_ABSOLUTE_PATH);
    try {
      const data = fs.readFileSync(CRAWLER_ABSOLUTE_PATH, "utf8");
      this.crawlerMessages = data
        .split("\n")
        .map((message) => message.trim())
        .filter((message) => message.length);

      logger.log("Loaded", this.crawlerMessages.length, "crawler messages");
    } catch (err) {
      if (err.code === "ENOENT") {
        // handle no file found
        logger.error("No crawler file found");
      } else {
        // handle any other error
        logger.error("Unable to load from crawler file");
      }
    }
  }

  private saveCrawlerMessages() {
    logger.log("Saving crawler messages to", CRAWLER_ABSOLUTE_PATH);
    try {
      fs.writeFileSync(CRAWLER_ABSOLUTE_PATH, this.crawlerMessages.join("\n"), "utf8");
      logger.log("Saved", this.crawlerMessages.length, "crawler messages");
    } catch (err) {
      if (err.code === "ENOENT") {
        // handle no file found
        logger.error("No crawler file found");
      } else {
        // handle any other error
        logger.error("Unable to save to crawler file");
      }
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
    if (stations?.length) this.provinceStations = mergeProvinceStationClimateDefaults(stations);

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

  /** Refresh {@link flavours} from `cfg/flavours` synchronously (e.g. after delete). */
  public syncFlavoursFromDisk() {
    try {
      const files = fs
        .readdirSync(FLAVOUR_DIRECTORY)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""));
      this.flavours.splice(0, this.flavours.length, ...files);
      logger.log("Synced flavours list from disk:", this.flavours.length);
    } catch (err) {
      logger.error("Failed to sync flavours from disk", err);
      this.flavours.splice(0, this.flavours.length);
    }
  }

  public setMiscSettings(
    rejectInHourConditionUpdates: boolean,
    alternateRecordsSource: string,
    logLevel?: string,
    ltceVirtualClimateId?: string | null
  ) {
    this.misc.alternateRecordsSource = alternateRecordsSource;
    this.misc.rejectInHourConditionUpdates = rejectInHourConditionUpdates;
    if (typeof logLevel === "string") {
      this.misc.logLevel = normalizeLogLevel(logLevel, this.misc.logLevel ?? "warn");
      setLogLevel(this.misc.logLevel);
    }
    if (ltceVirtualClimateId !== undefined) {
      const raw = ltceVirtualClimateId === null ? "" : String(ltceVirtualClimateId).trim();
      this.misc.ltceVirtualClimateId = raw.length ? raw : undefined;
    }
  }

  public setLookAndFeelSettings(
    patch: Partial<Pick<LookAndFeel, "flavour" | "showFooterFreshnessHint" | "useOfficialFonts">>
  ) {
    let flavourChanged = false;
    if (patch.flavour !== undefined) {
      if (!patch.flavour) this.lookAndFeel.flavour = "default";
      else this.lookAndFeel.flavour = patch.flavour;
      flavourChanged = true;
    }
    if (patch.showFooterFreshnessHint !== undefined) {
      this.lookAndFeel.showFooterFreshnessHint = patch.showFooterFreshnessHint;
    }
    if (patch.useOfficialFonts !== undefined) {
      this.lookAndFeel.useOfficialFonts = patch.useOfficialFonts;
    }
    if (flavourChanged) this.loadFlavour();
  }

  public setGfx(patch: GfxRuntimeConfig) {
    if (!patch || typeof patch !== "object") return;
    this.gfx = {
      displayAspectRatio:
        patch.displayAspectRatio !== undefined
          ? this.normalizeDisplayAspectRatio(patch.displayAspectRatio)
          : (this.gfx?.displayAspectRatio ?? DEFAULT_GFX.displayAspectRatio),
      displayResolution:
        patch.displayResolution !== undefined
          ? this.normalizeDisplayResolution(patch.displayResolution)
          : (this.gfx?.displayResolution ?? DEFAULT_GFX.displayResolution),
      features: { ...DEFAULT_GFX.features, ...(this.gfx?.features ?? {}), ...(patch.features ?? {}) },
      safeArea: { ...DEFAULT_GFX.safeArea, ...(this.gfx?.safeArea ?? {}), ...(patch.safeArea ?? {}) },
      retro: { ...DEFAULT_GFX.retro, ...(this.gfx?.retro ?? {}), ...(patch.retro ?? {}) },
    };
    this.clampGfxRetro(this.gfx.retro);
    if (patch.features?.authenticRefreshEnabled !== undefined) {
      this.authenticRefresh = this.normalizeAuthenticRefresh({
        ...this.authenticRefresh,
        enabled: !!patch.features.authenticRefreshEnabled,
      });
    }
  }

  public setAuthenticRefresh(patch: Partial<AuthenticRefreshConfig>) {
    if (!patch || typeof patch !== "object") return;
    this.authenticRefresh = this.normalizeAuthenticRefresh({ ...this.authenticRefresh, ...patch });
  }

  private normalizeDisplayAspectRatio(raw: unknown): GfxDisplayAspectRatio {
    return raw === "16:9" ? "16:9" : "4:3";
  }

  private normalizeDisplayResolution(raw: unknown): GfxDisplayResolution {
    return raw === "hd" ? "hd" : "sd";
  }

  private normalizeAuthenticRefresh(next: AuthenticRefreshConfig): AuthenticRefreshConfig {
    const cps = Math.round(Number(next.charsPerSecond ?? DEFAULT_AUTHENTIC_REFRESH.charsPerSecond));
    const jitter = Math.round(Number(next.jitterMsPerCharMax ?? DEFAULT_AUTHENTIC_REFRESH.jitterMsPerCharMax));
    return {
      enabled: !!next.enabled,
      charsPerSecond: Number.isFinite(cps)
        ? Math.min(120, Math.max(1, cps))
        : (DEFAULT_AUTHENTIC_REFRESH.charsPerSecond ?? 100),
      jitterMsPerCharMax: Number.isFinite(jitter) ? Math.min(100, Math.max(0, jitter)) : 12,
      continuationGraphemeReveal: next.continuationGraphemeReveal !== false,
      respectReducedMotion: next.respectReducedMotion !== false,
      streamUnit: next.streamUnit === "word" ? "word" : "grapheme",
    };
  }

  /** Normalize `retro.reloadLineMs` and booleans after merge from disk or POST /config/gfx. */
  private clampGfxRetro(retro: GfxRuntimeConfig["retro"]): void {
    if (!retro) return;
    const raw = retro.reloadLineMs;
    const n = Math.round(Number(raw));
    retro.reloadLineMs = Number.isFinite(n)
      ? Math.min(GFX_RELOAD_LINE_MS_MAX, Math.max(GFX_RELOAD_LINE_MS_MIN, n))
      : GFX_RELOAD_LINE_MS_DEFAULT;
    if (retro.vhsAnalogLayerEnabled === undefined) retro.vhsAnalogLayerEnabled = false;
    if (retro.vhsHeadSwitchTearEnabled === undefined) retro.vhsHeadSwitchTearEnabled = false;
    const tearOp = Number(retro.vhsHeadSwitchTearOpacity);
    retro.vhsHeadSwitchTearOpacity = Number.isFinite(tearOp)
      ? Math.min(1, Math.max(0, tearOp))
      : GFX_DEFAULT_VHS_HEAD_SWITCH_TEAR_OPACITY;
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
