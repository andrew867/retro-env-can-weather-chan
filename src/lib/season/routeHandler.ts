import { Request, Response } from "express";
import { RWC_DATA_FETCHED_AT_HEADER } from "consts";
import { getIsWinterSeason, isSunSpotSeason, isWindchillSeason } from "lib/date";
import { initializeClimateNormals, initializeHistoricalTempPrecip, initializeCurrentConditions } from "lib/eccc";

const historicalData = initializeHistoricalTempPrecip();
const climateNormals = initializeClimateNormals();
const conditions = initializeCurrentConditions();

function setFetchedAtHeader(res: Response, iso: string | null) {
  if (iso) res.setHeader(RWC_DATA_FETCHED_AT_HEADER, iso);
}

export function getSeasonData(req: Request, res: Response) {
  setFetchedAtHeader(res, conditions.getLastSuccessfulFetchIso());
  res.json({
    season: {
      windchill: isWindchillSeason(),
      sunspot: isSunSpotSeason(),
      winter: getIsWinterSeason(),
    },
    seasonPrecip: {
      ...historicalData.seasonPrecipData(),
      normal: climateNormals.getNormalPrecipForCurrentSeason()?.amount,
    },
  });
}

export function getLastMonthSummary(req: Request, res: Response) {
  setFetchedAtHeader(res, conditions.getLastSuccessfulFetchIso());
  const lastMonthSummary = historicalData.lastMonthSummary();
  const lastMonthNormal = climateNormals.getNormalsForLastMonth();

  res.json({ actual: lastMonthSummary, normal: lastMonthNormal });
}
