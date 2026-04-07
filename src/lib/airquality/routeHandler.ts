import { Request, Response } from "express";
import { RWC_DATA_FETCHED_AT_HEADER } from "consts";
import { initializeAirQuality } from "lib/eccc";
import { doesAQHINeedWarning, getAQHITextSummary } from "./utils";
import { getECCCAirQualityStations } from "lib/eccc/airQualityStations";

const airQuality = initializeAirQuality();

function setFetchedAtHeader(res: Response, iso: string | null) {
  if (iso) res.setHeader(RWC_DATA_FETCHED_AT_HEADER, iso);
}

export function getAirQuality(req: Request, res: Response) {
  setFetchedAtHeader(res, airQuality.getLastFetchIso());
  const obs = airQuality.observation;
  if (!obs) {
    res.status(200).json(null);
    return;
  }

  const v = obs.value;
  const hasValue = v != null && !Number.isNaN(Number(v));

  res.status(200).json({
    ...obs,
    textValue: hasValue ? getAQHITextSummary(v) : undefined,
    showWarning: hasValue ? doesAQHINeedWarning(v) : false,
  });
}

export async function postStationsHandler(req: Request, res: Response) {
  const {
    body: { search = "" },
  } = req ?? {};

  try {
    res.json({ results: await getECCCAirQualityStations(search) });
  } catch (e) {
    res.status(500).json({ error: "Unable to search air quality stations" });
  }
}
