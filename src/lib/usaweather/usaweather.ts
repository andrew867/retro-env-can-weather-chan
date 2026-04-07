import {
  USA_WEATHER_STATIONS,
  USA_WEATHER_FETCH_INTERVAL,
  MAX_USA_STATIONS_PER_PAGE,
  EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS,
} from "consts";
import { USAStationConfig, USAStationObservation, USAStationObservations } from "types";
import Logger from "lib/logger";
import axios from "lib/backendAxios";
import { harshTruncateConditions } from "lib/conditions";
import eventbus from "lib/eventbus";
import { generateConditionsUUID } from "lib/eccc/utils";
import { initializeConfig } from "lib/config";

const config = initializeConfig();

const logger = new Logger("USA");
class USAWeather {
  private _usaStations: USAStationObservations = [];
  private _expectedConditionUUID: string;
  private _fetchedAt: string | null = null;
  private _lastBatchStartMs = 0;
  private _usaBatchId = 0;

  constructor() {
    this.periodicUpdate();
    setInterval(() => this.periodicUpdate(), USA_WEATHER_FETCH_INTERVAL);

    eventbus.addListener(EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS, (data) => this.forceUpdate(data));
  }

  private periodicUpdate(clearExistingData: boolean = false) {
    const now = Date.now();
    if (!clearExistingData && this._lastBatchStartMs && now - this._lastBatchStartMs < 2000) {
      return;
    }
    this._lastBatchStartMs = now;
    const batchId = ++this._usaBatchId;
    this.fetchWeatherForStations(USA_WEATHER_STATIONS, this._usaStations, clearExistingData, batchId);
  }

  private forceUpdate(conditionUUID: string) {
    // update expected condition uuid from main station
    const hadExpectedConditionUUID = !!this._expectedConditionUUID;
    const shouldClear = this._expectedConditionUUID !== conditionUUID;
    this._expectedConditionUUID = conditionUUID;

    // if we didn't have an expected condition uuid, we dont need to force an update
    if (!hadExpectedConditionUUID) return;

    // otherwise we can call periodic update early since other stations probably updated
    this.periodicUpdate(shouldClear);
  }

  private isStationReporting(station: USAStationObservation) {
    return (
      station?.condition && !station?.condition?.toLowerCase().includes("unknown") && station?.temperature !== null
    );
  }

  private fetchWeatherForStations(
    stations: USAStationConfig[],
    observations: USAStationObservations,
    clearExistingData: boolean = false,
    batchId: number
  ) {
    logger.log("Fetching latest observations");
    // empty out the current observations and generate new data
    if (clearExistingData || !observations?.length) {
      observations.splice(
        0,
        observations.length,
        ...[...stations].map(
          (stationConfig) =>
            ({ ...stationConfig, condition: null, temperature: null } as USAStationConfig & USAStationObservation)
        )
      );
    }

    // loop through stations and get current conditions for them
    stations.forEach((station) => this.fetchWeatherForStation(station, observations, batchId));
  }

  private fetchWeatherForStation(
    station: USAStationConfig,
    observations: USAStationObservations,
    batchId: number
  ) {
    axios
      .get(`https://api.weather.gov/stations/${station.code}/observations/latest`)
      .then((resp) => {
        if (batchId !== this._usaBatchId) return;
        const { data: weather } = resp;
        if (!weather) throw "Unable to parse USA weather data";

        const stationIx = observations.findIndex((observationStation) => observationStation.code === station.code);
        if (stationIx === -1) return;

        const { properties } = weather;

        // handle rejecting in-hour updates for these stations too
        const [timestamp] = properties.timestamp.split("+");
        const conditionUUID = generateConditionsUUID(timestamp.replace(/[-T:]/g, ""));
        if (config.misc.rejectInHourConditionUpdates && conditionUUID === observations[stationIx].conditionUUID) return;

        const { textDescription: condition = null, temperature = null } = properties ?? {};
        observations.splice(stationIx, 1, {
          ...station,
          condition: condition ?? null,
          abbreviatedCondition: condition ? harshTruncateConditions(condition) : null,
          temperature: temperature?.value && !isNaN(temperature.value) ? Number(temperature.value) : null,
          conditionUUID,
        });
        this._fetchedAt = new Date().toISOString();
      })
      .catch((err) => logger.error(station.name, "failed to fetch data", err));
  }

  public getLastSuccessfulFetchIso(): string | null {
    return this._fetchedAt;
  }

  public weather() {
    // when we return we should filter down to just reporting stations, and then limit each one
    return this._usaStations
      .filter((stationObservation) => this.isStationReporting(stationObservation))
      .slice(0, MAX_USA_STATIONS_PER_PAGE);
  }
}

let usaWeather: USAWeather = null;
export function initializeUSAWeather(): USAWeather {
  if (process.env.NODE_ENV === "test") return new USAWeather();
  if (usaWeather) return usaWeather;

  usaWeather = new USAWeather();
  return usaWeather;
}
