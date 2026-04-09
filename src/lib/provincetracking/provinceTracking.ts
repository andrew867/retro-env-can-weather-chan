const Weather = require("ec-weather-js");
import fs from "fs";
import { EVENT_BUS_CONFIG_CHANGE_PROVINCE_TRACKING, PROVINCE_TRACKING_TEMP_TO_TRACK } from "consts";
import { rwcLkgMaxAgeMs } from "consts/reliability.consts";
import axios from "lib/backendAxios";
import { axiosGetWithMscMirror } from "lib/eccc/mscHttpMirror";
import { initializeConfig } from "lib/config";
import Logger from "lib/logger";
import type { ProvinceTracking as ProvinceTrackingSnapshot, ProvinceStationTracking, ProvinceStations } from "types";
import { LastKnownGood } from "lib/reliability/lastKnownGood";
import { initializeCurrentConditions, initializeHistoricalTempPrecip } from "lib/eccc";
import eventbus from "lib/eventbus";
import { format, subDays } from "date-fns";
import { GetWeatherFileFromECCC } from "lib/eccc/datamart";
import { fetchYesterdayPrecipFromClimateBulk } from "lib/eccc/provinceYesterdayClimatePrecip";

const logger = new Logger("ProvinceTracking");
const PROVINCE_TRACKING_FILE = "db/province_tracking.json";

const conditions = initializeCurrentConditions();
const historicalData = initializeHistoricalTempPrecip();

function normalizeProvinceStationCode(code: string): string {
  return code.replace(/\s/g, "").toUpperCase();
}

/** Disk JSON only had `{ name, code }`; merge full `ProvinceStation` from config (e.g. `climateStationId`). */
function stationFromConfigForCode(stations: ProvinceStations, code: string): ProvinceStations[number] | undefined {
  const key = normalizeProvinceStationCode(code);
  return stations.find((s) => normalizeProvinceStationCode(s.code) === key);
}

/**
 * ec-weather-js `simplify()` turns `<precip>2.4</precip>` into a string; with attributes it stays `{ value, units }`.
 * Reading only `.value` misses the common text-only form and left every station on "MISSING".
 */
function parseYesterdayPrecipScalar(raw: unknown, defaultUnits: "mm" | "cm"): { amount: number; units: "mm" | "cm" } | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { amount: raw, units: defaultUnits };
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t === "" || /^nil|n\/a$/i.test(t)) return { amount: 0, units: defaultUnits };
    if (/^trace$/i.test(t)) return { amount: 0, units: defaultUnits };
    const n = Number(t);
    return Number.isFinite(n) ? { amount: n, units: defaultUnits } : null;
  }
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const o = raw as { value?: unknown; units?: string };
    const v = o.value;
    const u = (o.units ?? "").toLowerCase();
    const units: "mm" | "cm" = u === "cm" ? "cm" : defaultUnits;
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isFinite(n)) return null;
    return { amount: n, units };
  }
  return null;
}

function yesterdayPrecipFromCitypage(yesterdayConditions: unknown): { amount: number; unit: string } | null {
  if (yesterdayConditions == null || typeof yesterdayConditions !== "object") return null;
  const yc = yesterdayConditions as Record<string, unknown>;

  const snow = parseYesterdayPrecipScalar(yc.snow, "cm");
  if (snow && snow.amount > 0) {
    return { amount: snow.amount, unit: "cm snow" };
  }

  const liquid = parseYesterdayPrecipScalar(yc.precip, "mm");
  if (liquid) {
    return { amount: liquid.amount, unit: liquid.units === "cm" ? "cm snow" : "mm" };
  }

  return null;
}

class ProvinceTracking {
  private _stations: ProvinceStations;
  private _tracking: ProvinceStationTracking[];
  private _displayTemp: string;
  private _yesterdayPrecipDate: string = "";
  private _periodicBusy = false;
  private _fetchedAt: string | null = null;
  private readonly _lkg = new LastKnownGood<ProvinceTrackingSnapshot>();

  constructor() {
    this.load();
    this.initialize();
    setInterval(() => this.periodicUpdate(), 5 * 60 * 1000);

    eventbus.addListener(EVENT_BUS_CONFIG_CHANGE_PROVINCE_TRACKING, () => this.initialize());
  }

  private initialize() {
    if (!config.provinceHighLowEnabled) {
      logger.log("Province tracking is disabled");
      return;
    }

    // store what stations we're tracking
    this._stations = config.provinceStations ?? [];

    // if we're tracking stations already then filter out stations that aren't in the stations list, otherwise do an empty array
    this._tracking = this._tracking
      ? this._tracking.filter(
          (trackingStation) =>
            this._stations.findIndex((station) => trackingStation.station.code === station.code) !== -1
        )
      : [];
    this.rehydrateStationsFromConfig();
    logger.log("Tracking", this._stations?.length || 0, "locations across the province");

    this.periodicUpdate();
  }

  /** Replace each row's `station` with the canonical config object so persisted JSON cannot strip `climateStationId`. */
  private rehydrateStationsFromConfig() {
    if (!this._tracking?.length) return;
    for (let i = 0; i < this._tracking.length; i++) {
      const row = this._tracking[i];
      const canonical = stationFromConfigForCode(this._stations, row.station.code);
      if (canonical) {
        this._tracking[i] = { ...row, station: canonical };
      }
    }
  }

  private periodicUpdate() {
    if (this._periodicBusy) {
      return;
    }
    this._periodicBusy = true;

    if (!this._tracking?.length) {
      this._tracking = this._stations.map(
        (provinceStation) =>
          ({
            station: provinceStation,
            minTemp: null,
            maxTemp: null,
            displayTemp: null,
            yesterdayPrecip: null,
            yesterdayPrecipUnit: "mm",
          } as ProvinceStationTracking)
      );
    }

    // check what temps to track/display
    const displayTemp = this._displayTemp;
    this.setTempScaleToDisplay();

    // if the display mode (min vs max column) changed, reset the opposite accumulator
    if (displayTemp !== this._displayTemp) this.resetTracking(!!displayTemp);

    logger.log("Updating data for stations");

    // loop through stations and get the conditions for them
    const promises: Promise<void>[] = [];
    this._tracking.forEach((station) => promises.push(this.fetchWeatherForStation(station)));

    Promise.allSettled(promises).then(() => {
      this.applyDisplayTempsFromTrackers();
      this._fetchedAt = new Date().toISOString();
      this.save();
      this._periodicBusy = false;
    });
  }

  /** After each fetch batch, materialize `displayTemp` from running min/max so the grid is never stuck on "M" after a cold start. */
  private applyDisplayTempsFromTrackers() {
    if (!this._tracking?.length) return;
    for (let i = 0; i < this._tracking.length; i++) {
      const station = this._tracking[i];
      if (this._displayTemp === PROVINCE_TRACKING_TEMP_TO_TRACK.MIN_TEMP) {
        const v = station.minTemp;
        station.displayTemp = this.isValidTrackedTemp(v) ? v : "M";
      } else if (this._displayTemp === PROVINCE_TRACKING_TEMP_TO_TRACK.MAX_TEMP) {
        const v = station.maxTemp;
        station.displayTemp = this.isValidTrackedTemp(v) ? v : "M";
      }
    }
  }

  private isValidTrackedTemp(v: number | null | undefined): v is number {
    return typeof v === "number" && Number.isFinite(v);
  }

  public getLastFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(): void {
    this.periodicUpdate();
  }

  public getDataFetchedAtForHeader(): string | null {
    if (!config.provinceHighLowEnabled) return this._fetchedAt;
    const fresh = this.snapshot();
    if (this.snapshotHasUsefulDisplayTemps(fresh)) return this._fetchedAt;
    const lkgSnap = this._lkg.getIfFresh(rwcLkgMaxAgeMs());
    if (lkgSnap && this.snapshotHasUsefulDisplayTemps(lkgSnap)) return this._lkg.savedAtIso;
    return this._fetchedAt;
  }

  private snapshot(): ProvinceTrackingSnapshot {
    return {
      tracking: this._tracking,
      isOvernight: this._displayTemp === PROVINCE_TRACKING_TEMP_TO_TRACK.MIN_TEMP,
      yesterdayPrecipDate: this._yesterdayPrecipDate,
    };
  }

  private snapshotHasUsefulDisplayTemps(s: ProvinceTrackingSnapshot): boolean {
    return s.tracking.some((t) => t.displayTemp !== "M");
  }

  private async fetchWeatherForStation(station: ProvinceStationTracking) {
    const { name, code } = station.station;

    const [province, stationID] = code.split("/");
    const url = await GetWeatherFileFromECCC(province, stationID);
    if (!url) return Promise.reject("URL was invalid.");

    return axiosGetWithMscMirror(axios, url)
      .then(async (resp) => {
        const data = resp && resp.data;
        const weather = new Weather(data);
        if (!weather) throw "Unable to parse weather data";

        // Refresh when empty, when we previously failed to parse ("MISSING"), or after 02:00 (yesterday summary stable).
        const shouldRefreshPrecip =
          station.yesterdayPrecip === null ||
          station.yesterdayPrecip === "MISSING" ||
          this.shouldUpdatePrecipData();

        if (shouldRefreshPrecip) {
          const { yesterdayConditions } = weather.all;

          const isLocalStation =
            normalizeProvinceStationCode(station.station.code) ===
            normalizeProvinceStationCode(`${config.primaryLocation.province}/${config.primaryLocation.location}`);

          const histSnowAmt = isLocalStation ? historicalData.yesterdaySnowData().amount : null;
          const histRainAmt = isLocalStation ? historicalData.yesterdayPrecipData().amount : null;

          const fromHistorical =
            typeof histSnowAmt === "number" && histSnowAmt > 0
              ? { amount: histSnowAmt, unit: "cm snow" as const }
              : typeof histRainAmt === "number"
                ? { amount: histRainAmt, unit: "mm" as const }
                : null;

          const fromApi = yesterdayPrecipFromCitypage(yesterdayConditions);

          let resolved: { amount: number; unit: string } | null = fromHistorical;
          if (!resolved && fromApi) resolved = fromApi;
          if (!resolved && yesterdayConditions != null) {
            resolved = { amount: 0, unit: "mm" };
          }

          if (
            !resolved &&
            typeof station.station.climateStationId === "number" &&
            Number.isFinite(station.station.climateStationId)
          ) {
            const climateRow = await fetchYesterdayPrecipFromClimateBulk(
              station.station.climateStationId,
              conditions.observedDateTimeAtStation()
            );
            if (climateRow) resolved = climateRow;
          }

          if (resolved) {
            station.yesterdayPrecip = resolved.amount;
            station.yesterdayPrecipUnit = resolved.unit;
            this._yesterdayPrecipDate = format(subDays(conditions.observedDateTimeAtStation(), 1), "MMM dd").replace(
              /\s0/i,
              "  "
            );
          } else {
            station.yesterdayPrecip = "MISSING";
            station.yesterdayPrecipUnit = "mm";
          }
        }

        // Running min/max from each observation so a cold start (no prior night) still fills the grid on first successful fetch.
        const temp = weather.current?.temperature?.value;
        if (temp === null || temp === undefined || isNaN(temp)) return;

        const tempAsNumber = Number(temp);
        if (!this.isValidTrackedTemp(station.minTemp) || tempAsNumber < station.minTemp!) {
          station.minTemp = tempAsNumber;
        }
        if (!this.isValidTrackedTemp(station.maxTemp) || tempAsNumber > station.maxTemp!) {
          station.maxTemp = tempAsNumber;
        }
      })
      .catch((err) => logger.error(name, url, "failed to fetch data", err));
  }

  private resetTracking(resetTemps: boolean) {
    logger.log("Switching over tracking and setting display value");

    this._tracking.forEach((station, ix, arr) => {
      if (this._displayTemp === PROVINCE_TRACKING_TEMP_TO_TRACK.MIN_TEMP) {
        arr[ix] = {
          ...arr[ix],
          displayTemp: this.isValidTrackedTemp(station.minTemp) ? station.minTemp : "M",
          maxTemp: resetTemps ? null : station.maxTemp,
        };
      } else if (this._displayTemp === PROVINCE_TRACKING_TEMP_TO_TRACK.MAX_TEMP) {
        arr[ix] = {
          ...arr[ix],
          displayTemp: this.isValidTrackedTemp(station.maxTemp) ? station.maxTemp : "M",
          minTemp: resetTemps ? null : station.minTemp,
        };
      }
    });
  }

  private setTempScaleToDisplay() {
    const time = conditions?.observedDateTimeAtStation();
    const hour = time.getHours();

    // from 8pm to 8am we need to display the max temp
    // from 8am to 8pm we need to display the min temp
    if (hour >= 20 || hour < 8) this._displayTemp = PROVINCE_TRACKING_TEMP_TO_TRACK.MAX_TEMP;
    else this._displayTemp = PROVINCE_TRACKING_TEMP_TO_TRACK.MIN_TEMP;
  }

  private shouldUpdatePrecipData() {
    const time = conditions?.observedDateTimeAtStation();
    const hour = time.getHours();

    // if it's after 2am we can update precip data, if not leave it as is
    return hour >= 2;
  }

  private load() {
    logger.log("Loading province tracking from", PROVINCE_TRACKING_FILE);
    try {
      const data = fs.readFileSync(PROVINCE_TRACKING_FILE, "utf8");
      if (!data?.length) throw "No data present in json";

      this._tracking = JSON.parse(data);

      logger.log("Loaded province tracking from json");
    } catch (err) {
      if (err.code === "ENOENT") {
        // handle no file found
        logger.error("No province tracking found");
      } else {
        // handle any other error
        logger.error("Unable to load from province tracking json");
      }
    }
  }

  private save() {
    logger.log("Storing province tracking");

    fs.writeFile(PROVINCE_TRACKING_FILE, JSON.stringify(this._tracking), "utf8", () => {
      logger.log("Stored province tracking");
    });
  }

  public provinceTracking(): ProvinceTrackingSnapshot {
    if (!config.provinceHighLowEnabled) {
      return this.snapshot();
    }
    const fresh = this.snapshot();
    const lkgSnap = this._lkg.getIfFresh(rwcLkgMaxAgeMs());
    const freshUseful = this.snapshotHasUsefulDisplayTemps(fresh);
    if (freshUseful) {
      this._lkg.save(JSON.parse(JSON.stringify(fresh)) as ProvinceTrackingSnapshot);
      return fresh;
    }
    if (lkgSnap && this.snapshotHasUsefulDisplayTemps(lkgSnap)) {
      return lkgSnap;
    }
    return fresh;
  }
}

const config = initializeConfig();

let provinceTracking: ProvinceTracking = null;
export function initializeProvinceTracking(): ProvinceTracking {
  if (process.env.NODE_ENV === "test") return new ProvinceTracking();
  if (provinceTracking) return provinceTracking;

  provinceTracking = new ProvinceTracking();
  return provinceTracking;
}
