import { DEFAULT_WEATHER_STATION_ID } from "consts";

/**
 * ECCC citypage site codes (siteList.xml) for Halton Region + City of Hamilton —
 * matches the “regional outlook” style used for the default Winnipeg site.
 */
const SOUTHERN_ON_OUTLOOK_STATION_IDS = new Set([
  "s0000367", // Oakville
  "s0000368", // Burlington
  "s0000549", // Hamilton
  "s0000789", // Halton Hills
]);

function cityImpliesSouthernOntarioOutlook(city: string | undefined): boolean {
  if (!city) return false;
  const c = city.toLowerCase();
  return (
    c.includes("oakville") ||
    c.includes("burlington") ||
    c.includes("hamilton") ||
    c.includes("halton hills")
  );
}

export function isSouthernOntarioOutlookArea(stationID: string, city: string | undefined): boolean {
  return SOUTHERN_ON_OUTLOOK_STATION_IDS.has(stationID) || cityImpliesSouthernOntarioOutlook(city);
}

/** Title fragment after “Outlook for …” (lowercase to match “southern manitoba”). */
export function getOutlookForAreaLabel(stationID: string, city: string | undefined): string {
  if (stationID === DEFAULT_WEATHER_STATION_ID) return "southern manitoba";
  if (isSouthernOntarioOutlookArea(stationID, city)) return "southern ontario";
  return city ?? "";
}

/**
 * Short label for AQHI warning (screen uses `.slice(0, 3)`).
 * Winnipeg default → WPG; Halton/Hamilton belt → YHM; else full city name.
 */
export function getAqhiCityAbbreviation(stationID: string, city: string | undefined): string {
  if (stationID === DEFAULT_WEATHER_STATION_ID) return "WPG";
  if (isSouthernOntarioOutlookArea(stationID, city)) return "YHM";
  return city ?? "";
}
