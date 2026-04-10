import {
  USA_WEATHER_STATIONS,
  USA_WEATHER_FETCH_INTERVAL,
  USA_WEATHER_HTTP_TIMEOUT_MS,
  MAX_USA_STATIONS_PER_PAGE,
  EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS,
} from "consts";
import { USAStationConfig, USAStationObservation, USAStationObservations } from "types";
import Logger from "lib/logger";
import axios from "lib/backendAxios";
import { harshTruncateConditions } from "lib/conditions";
import eventbus from "lib/eventbus";
import { initializeConfig } from "lib/config";
import { rwcLkgMaxAgeMs } from "consts/reliability.consts";
import { LastKnownGood } from "lib/reliability/lastKnownGood";
import { fetchAwcMetarRows, parseAwcMetarRow, shouldTryAwcAfterNwsFailure } from "lib/usaweather/awcMetar";
import { formatFetchError } from "lib/eccc/fetchErrors";
import { fetchNwsLatestObservation } from "lib/usaweather/nwsLatestObservation";

const config = initializeConfig();

const logger = new Logger("USA");

class USAWeather {
  private _usaStations: USAStationObservations = [];
  private _expectedConditionUUID: string;
  private _fetchedAt: string | null = null;
  private _lastBatchStartMs = 0;
  private _usaBatchId = 0;
  private readonly _lkg = new LastKnownGood<USAStationObservations>();

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
    const hadExpectedConditionUUID = !!this._expectedConditionUUID;
    const shouldClear = this._expectedConditionUUID !== conditionUUID;
    this._expectedConditionUUID = conditionUUID;

    if (!hadExpectedConditionUUID) return;

    this.periodicUpdate(shouldClear);
  }

  private isStationReporting(station: USAStationObservation) {
    return (
      station?.condition && !station?.condition?.toLowerCase().includes("unknown") && station.temperature !== null
    );
  }

  private fetchWeatherForStations(
    stations: USAStationConfig[],
    observations: USAStationObservations,
    clearExistingData: boolean = false,
    batchId: number
  ) {
    logger.log("Fetching latest observations");
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

    stations.forEach((station) => this.fetchWeatherForStation(station, observations, batchId));
  }

  private fetchWeatherForStation(
    station: USAStationConfig,
    observations: USAStationObservations,
    batchId: number
  ) {
    void this.fetchWeatherForStationAsync(station, observations, batchId);
  }

  private async fetchWeatherForStationAsync(
    station: USAStationConfig,
    observations: USAStationObservations,
    batchId: number
  ) {
    const stationIx = observations.findIndex((observationStation) => observationStation.code === station.code);
    if (stationIx === -1) return;

    const applyObservation = (
      condition: string | null,
      temperature: number | null,
      conditionUUID: string,
      source: "nws" | "awc"
    ) => {
      if (batchId !== this._usaBatchId) return;
      if (config.misc.rejectInHourConditionUpdates && conditionUUID === observations[stationIx].conditionUUID)
        return;
      observations.splice(stationIx, 1, {
        ...station,
        condition,
        abbreviatedCondition: condition ? harshTruncateConditions(condition) : null,
        temperature,
        conditionUUID,
      });
      this._fetchedAt = new Date().toISOString();
      if (source === "awc") {
        logger.log(`${station.name}: using AWC METAR backup (NWS observation unavailable)`);
      }
    };

    try {
      const nws = await fetchNwsLatestObservation(axios, station.code, USA_WEATHER_HTTP_TIMEOUT_MS);
      if (batchId !== this._usaBatchId) return;
      if (!nws) throw new Error("NWS observation missing or incomplete");
      applyObservation(nws.condition, nws.temperatureC, nws.conditionUUID, "nws");
    } catch (nwsErr) {
      if (!shouldTryAwcAfterNwsFailure(nwsErr)) {
        logger.warn(`${station.name}: NWS observation fetch failed (${formatFetchError(nwsErr)})`);
        return;
      }
      try {
        const map = await fetchAwcMetarRows(axios, [station.code], USA_WEATHER_HTTP_TIMEOUT_MS);
        const row = map.get(station.code.toUpperCase());
        const parsed = row ? parseAwcMetarRow(row) : null;
        if (!parsed) throw new Error("AWC METAR missing or incomplete");
        applyObservation(parsed.condition, parsed.temperatureC, parsed.conditionUUID, "awc");
      } catch (awcErr) {
        logger.warn(
          `${station.name}: NWS + AWC METAR failed (NWS: ${formatFetchError(nwsErr)}; AWC: ${formatFetchError(awcErr)})`
        );
      }
    }
  }

  public getLastSuccessfulFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(): void {
    this._lastBatchStartMs = 0;
    this.periodicUpdate(true);
  }

  public getDataFetchedAtForHeader(): string | null {
    const fresh = this.freshUsaSlice();
    if (fresh.length) return this._fetchedAt;
    const fallback = this._lkg.getIfFresh(rwcLkgMaxAgeMs());
    if (fallback?.length) return this._lkg.savedAtIso;
    return null;
  }

  private freshUsaSlice(): USAStationObservations {
    return this._usaStations
      .filter((stationObservation) => this.isStationReporting(stationObservation))
      .slice(0, MAX_USA_STATIONS_PER_PAGE);
  }

  public weather() {
    const fresh = this.freshUsaSlice();
    const merged = fresh.length ? fresh : this._lkg.getIfFresh(rwcLkgMaxAgeMs()) ?? [];
    if (fresh.length) {
      this._lkg.save(fresh);
    }
    return merged;
  }
}

let usaWeather: USAWeather = null;
export function initializeUSAWeather(): USAWeather {
  if (process.env.NODE_ENV === "test") return new USAWeather();
  if (usaWeather) return usaWeather;

  usaWeather = new USAWeather();
  return usaWeather;
}
