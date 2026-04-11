import { LTCE_WINNIPEG_AREA_VIRTUAL_CLIMATE_ID } from "lib/eccc/ltceDailyTemperatureRecords";

/**
 * Verified MSC identifiers for a primary citypage site: hourly bulk (`historicalDataStationID`),
 * pygeoapi `climate-normals` (`CLIMATE_IDENTIFIER` + posted `STN_ID`), and LTCE calendar-day temperature extremes.
 *
 * Unknown `location` codes are not guessed — operators keep manual IDs or we extend this table after live checks.
 *
 * **Oakville (`s0000367`)**: Burlington Piers (STN 7868) is the MSC hourly site aligned with that citypage;
 * MSC returns no usable `climate-normals` CSV for climate id 6151061, so seasonal normals use **Toronto
 * International Airport (6158350)** — real published 1981–2010 normals, geographically adjacent to the western GTA.
 *
 * **Hamilton (`s0000549`)**: Hourly bulk uses current Hamilton A (49908 / climate 6153193); 1981–2010 normals
 * are published under the legacy Hamilton A composite id **6153194** (posted STN 4932) on pygeoapi.
 */
export type CitypageClimateAnchor = {
  ltceVirtualClimateId: string;
  historicalDataStationID: number;
  climateNormalsClimateID: number;
  climateNormalsStationID: number;
};

const ANCHORS_BY_CITYPAGE_CODE: Record<string, CitypageClimateAnchor> = {
  s0000193: {
    ltceVirtualClimateId: LTCE_WINNIPEG_AREA_VIRTUAL_CLIMATE_ID,
    historicalDataStationID: 27174,
    climateNormalsClimateID: 5023222,
    climateNormalsStationID: 3698,
  },
  s0000367: {
    ltceVirtualClimateId: "VSON79V",
    historicalDataStationID: 7868,
    climateNormalsClimateID: 6158350,
    climateNormalsStationID: 5051,
  },
  s0000458: {
    ltceVirtualClimateId: "VSON143",
    historicalDataStationID: 51459,
    climateNormalsClimateID: 6158350,
    climateNormalsStationID: 5051,
  },
  s0000549: {
    ltceVirtualClimateId: "VSON77V",
    historicalDataStationID: 49908,
    climateNormalsClimateID: 6153194,
    climateNormalsStationID: 4932,
  },
  s0000280: {
    ltceVirtualClimateId: "VSNL24V",
    historicalDataStationID: 6720,
    climateNormalsClimateID: 8403506,
    climateNormalsStationID: 6720,
  },
};

/** Normalize `s0000458`, `ON/s0000458`, `NL/s0000280`, etc. to a lowercase citypage tail key. */
export function normalizeCitypageLocationCode(raw: string): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  const i = t.lastIndexOf("/");
  const tail = i >= 0 ? t.slice(i + 1) : t;
  return tail.toLowerCase();
}

export function getCitypageClimateAnchor(locationCode: string): CitypageClimateAnchor | null {
  const key = normalizeCitypageLocationCode(locationCode);
  return ANCHORS_BY_CITYPAGE_CODE[key] ?? null;
}
