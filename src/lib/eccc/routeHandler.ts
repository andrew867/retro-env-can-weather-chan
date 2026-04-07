import { Request, Response } from "express";
import { initializeCurrentConditions } from "./conditions";
import { isSunSpotSeason, isWindchillSeason, getIsWinterSeason } from "lib/date";
import { initializeAlertMonitor } from "./alertMonitor";
import {
  CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT,
  CONDITIONS_EVENT_STREAM_INTERVAL,
  RWC_DATA_FETCHED_AT_HEADER,
} from "consts";
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

function setFetchedAtHeader(res: Response, iso: string | null) {
  if (iso) res.setHeader(RWC_DATA_FETCHED_AT_HEADER, iso);
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
  attachConditionsSse(req, res, {
    intervalMs: CONDITIONS_EVENT_STREAM_INTERVAL,
    eventName: CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT,
    getData: () => conditions.observed(),
  });
}

export function getNational(req: Request, res: Response) {
  setFetchedAtHeader(res, nationalWeather.getLastSuccessfulFetchIso());
  res.json(nationalWeather.nationalWeather());
}

export function getUSA(req: Request, res: Response) {
  setFetchedAtHeader(res, usaWeather.getLastSuccessfulFetchIso());
  res.json(usaWeather.weather());
}

export function getSunspots(req: Request, res: Response) {
  setFetchedAtHeader(res, sunspots.getLastFetchIso());
  if (!isSunSpotSeason()) res.json([]);
  else res.json(sunspots.sunspots());
}

export function getProvinceTracking(req: Request, res: Response) {
  setFetchedAtHeader(res, provinceTracking.getLastFetchIso());
  res.json(provinceTracking.provinceTracking());
}

export function getHoldColdSpots(req: Request, res: Response) {
  setFetchedAtHeader(res, hotColdSpots.getLastFetchIso());
  res.json(hotColdSpots.hotColdSpots());
}
