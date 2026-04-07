import { Request, Response } from "express";
import { initializeCurrentConditions } from "./conditions";
import { isSunSpotSeason, isWindchillSeason, getIsWinterSeason } from "lib/date";
import { initializeAlertMonitor } from "./alertMonitor";
import { CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT, CONDITIONS_EVENT_STREAM_INTERVAL } from "consts";
import { attachConditionsSse } from "./sseLive";
import { initializeNationalWeather } from "lib/national";
import { initializeProvinceTracking } from "lib/provincetracking";
import { initializeCanadaProvincialHotColdSpot } from "./canadaHotColdSpot";
import { initializeUSAWeather } from "lib/usaweather";
import { initializeSunspots } from "lib/sunspots";

const conditions = initializeCurrentConditions();
const nationalWeather = initializeNationalWeather();
const provinceTracking = initializeProvinceTracking();
const alertMonitor = initializeAlertMonitor();
const hotColdSpots = initializeCanadaProvincialHotColdSpot();
const usaWeather = initializeUSAWeather();
const sunspots = initializeSunspots();

export function getObserved(req: Request, res: Response) {
  res.json(conditions.observed());
}

export function getForecast(req: Request, res: Response) {
  res.json(conditions.forecast());
}

export function getAlmanac(req: Request, res: Response) {
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
  res.json(alertMonitor.alerts());
}

export function getLive(req: Request, res: Response) {
  attachConditionsSse(req, res, {
    intervalMs: CONDITIONS_EVENT_STREAM_INTERVAL,
    eventName: CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT,
    getData: () => conditions.observed(),
  });
}

export function getNational(req: Request, res: Response) {
  res.json(nationalWeather.nationalWeather());
}

export function getUSA(req: Request, res: Response) {
  res.json(usaWeather.weather());
}

export function getSunspots(req: Request, res: Response) {
  if (!isSunSpotSeason()) res.json([]);
  else res.json(sunspots.sunspots());
}

export function getProvinceTracking(req: Request, res: Response) {
  res.json(provinceTracking.provinceTracking());
}

export function getHoldColdSpots(req: Request, res: Response) {
  res.json(hotColdSpots.hotColdSpots());
}
