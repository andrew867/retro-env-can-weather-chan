import {
  AIRPORT_METAR_FETCH_INTERVAL_MS,
  AIRPORT_METAR_HTTP_TIMEOUT_MS,
  DEFAULT_AIRPORT_METAR_STATIONS,
  MAX_AIRPORT_METAR_STATIONS,
} from "consts";
import { rwcLkgMaxAgeMs } from "consts/reliability.consts";
import { USAStationObservations } from "types";
import { LastKnownGood } from "lib/reliability/lastKnownGood";
import Logger from "lib/logger";
import axios from "lib/backendAxios";
import { harshTruncateConditions } from "lib/conditions";
import { initializeConfig } from "lib/config";
import { fetchAwcMetarRows, parseAwcMetarRow } from "lib/usaweather/awcMetar";

const logger = new Logger("AirportMetar");

/**
 * Polls ICAO METAR (Canadian + US + international) via AWC — same API as USA METAR backup.
 * Stations come from `airportMetarStations` in `cfg/rwc-config.json` (max {@link MAX_AIRPORT_METAR_STATIONS}).
 */
class AirportMetarWeather {
  private _observations: USAStationObservations = [];
  private _fetchedAt: string | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private readonly _lkg = new LastKnownGood<USAStationObservations>();

  constructor() {
    void this.fetchAll();
    this._timer = setInterval(() => void this.fetchAll(), AIRPORT_METAR_FETCH_INTERVAL_MS);
    if (this._timer.unref) this._timer.unref();
  }

  private stationConfigs(): { name: string; code: string }[] {
    let list = initializeConfig().airportMetarStations ?? [];
    if (!list.length) {
      list = DEFAULT_AIRPORT_METAR_STATIONS.map((row) => ({ ...row }));
    }
    return list.slice(0, MAX_AIRPORT_METAR_STATIONS);
  }

  private async fetchAll(): Promise<void> {
    const stations = this.stationConfigs();
    if (!stations.length) {
      this._observations = [];
      this._fetchedAt = null;
      return;
    }

    try {
      const map = await fetchAwcMetarRows(
        axios,
        stations.map((s) => s.code),
        AIRPORT_METAR_HTTP_TIMEOUT_MS
      );
      const next: USAStationObservations = [];
      for (const st of stations) {
        const row = map.get(st.code);
        const parsed = row ? parseAwcMetarRow(row) : null;
        if (!parsed) {
          logger.warn(`${st.name} (${st.code}): no METAR from AWC`);
          next.push({
            name: st.name,
            code: st.code,
            condition: null,
            abbreviatedCondition: undefined,
            temperature: null,
            conditionUUID: undefined,
          });
          continue;
        }
        next.push({
          name: st.name,
          code: st.code,
          condition: parsed.condition,
          abbreviatedCondition: harshTruncateConditions(parsed.condition),
          temperature: parsed.temperatureC,
          conditionUUID: parsed.conditionUUID,
        });
      }
      this._observations = next;
      this._fetchedAt = new Date().toISOString();
    } catch (err) {
      logger.warn("Airport METAR batch fetch failed", err);
    }
  }

  public getLastSuccessfulFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(): void {
    void this.fetchAll();
  }

  public getDataFetchedAtForHeader(): string | null {
    const fresh = this.filteredObservations();
    if (fresh.length) return this._fetchedAt;
    const fallback = this._lkg.getIfFresh(rwcLkgMaxAgeMs());
    if (fallback?.length) return this._lkg.savedAtIso;
    return null;
  }

  /** Observations for stations with valid temp + condition (same rules as USA screen). */
  private filteredObservations(): USAStationObservations {
    return this._observations.filter((o) => {
      const cond = o.condition;
      if (typeof cond !== "string" || !cond.trim()) return false;
      if (cond.toLowerCase().includes("unknown")) return false;
      const t = o.temperature;
      if (t === null || t === undefined || Number.isNaN(Number(t))) return false;
      return true;
    });
  }

  public observations(): USAStationObservations {
    const fresh = this.filteredObservations();
    const lkg = this._lkg.getIfFresh(rwcLkgMaxAgeMs());
    const fallback = Array.isArray(lkg) ? lkg : [];
    const merged = fresh.length ? fresh : fallback;
    if (fresh.length) {
      this._lkg.save(fresh);
    }
    return Array.isArray(merged) ? merged : [];
  }
}

let airportMetarWeather: AirportMetarWeather | null = null;

export function initializeAirportMetarWeather(): AirportMetarWeather {
  if (process.env.NODE_ENV === "test") return new AirportMetarWeather();
  if (airportMetarWeather) return airportMetarWeather;
  airportMetarWeather = new AirportMetarWeather();
  return airportMetarWeather;
}
