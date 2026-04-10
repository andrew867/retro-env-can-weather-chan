import { Request, Response } from "express";
import { initializeCurrentConditions } from "./conditions";
import { isSunSpotSeason, isWindchillSeason, getIsWinterSeason } from "lib/date";
import { initializeAlertMonitor } from "./alertMonitor";
import { RWC_DATA_FETCHED_AT_HEADER } from "consts";
import { registerWeatherLiveClient } from "./weatherSseHub";
import { registerAlertsLiveClient } from "./alertsSseHub";
import { initializeNationalWeather } from "lib/national";
import { initializeProvinceTracking } from "lib/provincetracking";
import { initializeCanadaProvincialHotColdSpot } from "./canadaHotColdSpot";
import { initializeUSAWeather } from "lib/usaweather";
import { initializeAirportMetarWeather } from "lib/airportMetar";
import { initializeSolarCycleSwpc } from "lib/solarCycleSwpc";
import { initializeSolarFlux } from "lib/solarFlux";
import { initializeSunspots } from "lib/sunspots";

const conditions = initializeCurrentConditions();
const nationalWeather = initializeNationalWeather();
const provinceTracking = initializeProvinceTracking();
const alertMonitor = initializeAlertMonitor();
const hotColdSpots = initializeCanadaProvincialHotColdSpot();
const usaWeather = initializeUSAWeather();
const airportMetar = initializeAirportMetarWeather();
const sunspots = initializeSunspots();
const solarFlux = initializeSolarFlux();
const solarCycleSwpc = initializeSolarCycleSwpc();

function setFetchedAtHeader(res: Response, iso: string | null) {
  if (iso) res.setHeader(RWC_DATA_FETCHED_AT_HEADER, iso);
}

function maxFetchedAtIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function getObserved(req: Request, res: Response) {
  setFetchedAtHeader(res, conditions.getLastSuccessfulFetchIso());
  res.json(conditions.observed());
}

export function getForecast(req: Request, res: Response) {
  setFetchedAtHeader(res, conditions.getLastSuccessfulFetchIso());
  res.json(conditions.forecast());
}

export function getAlmanac(req: Request, res: Response) {
  setFetchedAtHeader(res, conditions.getLastSuccessfulFetchIso());
  res.json(conditions.almanac());
}

export function getSeasons(req: Request, res: Response) {
  res.json({
    windchill: isWindchillSeason(),
    sunspot: isSunSpotSeason(),
    winter: getIsWinterSeason(),
  });
}

export function getAlerts(req: Request, res: Response) {
  setFetchedAtHeader(res, alertMonitor.getLastDataAsOf());
  res.json(alertMonitor.alerts());
}

export function getLive(req: Request, res: Response) {
  registerWeatherLiveClient(req, res, {
    getObserved: () => conditions.observed(),
    getForecast: () => ({
      ...conditions.forecast(),
      fetchedAt: conditions.getLastSuccessfulFetchIso(),
    }),
  });
}

/** SSE: instant CAP list updates (AMQP `*.WXO-DD.alerts.cap.#` on MSC public broker). */
export function getAlertsLive(req: Request, res: Response) {
  registerAlertsLiveClient(req, res, () => alertMonitor.alerts());
}

export function getNational(req: Request, res: Response) {
  setFetchedAtHeader(res, nationalWeather.getDataFetchedAtForHeader());
  res.json(nationalWeather.nationalWeather());
}

export function getUSA(req: Request, res: Response) {
  setFetchedAtHeader(res, usaWeather.getDataFetchedAtForHeader());
  res.json(usaWeather.weather());
}

export function getAirportMetar(req: Request, res: Response) {
  setFetchedAtHeader(res, airportMetar.getDataFetchedAtForHeader());
  const rows = airportMetar.observations();
  res.json(Array.isArray(rows) ? rows : []);
}

export function getSunspots(req: Request, res: Response) {
  const inSeason = isSunSpotSeason();
  const observations = inSeason ? sunspots.sunspots() : [];
  const fluxAt = solarFlux.getLastFetchIso();
  const obsAt = inSeason ? sunspots.getLastFetchIso() : null;
  const swpcAt = solarCycleSwpc.getLastFetchIso();
  const headerAt = maxFetchedAtIso(maxFetchedAtIso(fluxAt, obsAt), swpcAt);
  setFetchedAtHeader(res, headerAt);
  res.json({
    observations,
    solarFlux: solarFlux.getLatest(),
    solarCycleSwpc: solarCycleSwpc.getData(),
  });
}

export function getProvinceTracking(req: Request, res: Response) {
  setFetchedAtHeader(res, provinceTracking.getDataFetchedAtForHeader());
  res.json(provinceTracking.provinceTracking());
}

export function getHoldColdSpots(req: Request, res: Response) {
  setFetchedAtHeader(res, hotColdSpots.getLastFetchIso());
  res.json(hotColdSpots.hotColdSpots());
}
