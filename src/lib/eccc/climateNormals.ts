import axios from "lib/backendAxios";
import { formatFetchError, looksLikeClimateNormalsCsv } from "lib/eccc/fetchErrors";
import { format, getDaysInMonth, isValid, subMonths } from "date-fns";
import { initializeConfig } from "lib/config";
import { getShorthandMonthNamesForSeason } from "lib/date";
import Logger from "lib/logger";
import { ClimateNormalSeasonPrecip, ClimateNormalsForMonth } from "types";
import eventbus from "lib/eventbus";
import { EVENT_BUS_AUXILIARY_WEATHER_DATA_READY, EVENT_BUS_CONFIG_CHANGE_CLIMATE_NORMALS } from "consts";

/** MSC climate normals CSV: English element codes (NORMAL_ID) for 1981–2010 monthly normals. */
const NORMAL_ID = {
  meanDailyTemp: 1,
  meanDailyMaxTemp: 5,
  meanDailyMinTemp: 8,
  totalPrecipMm: 56,
} as const;

const MONTH_ABBR_TO_NUM: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * ECCC NORMAL_CODE: data-quality tier for 1981–2010 normals (A = strictest … D = ≥15 years).
 * Composite stations often publish C/D for temperature while precip remains A — accept all four.
 */
const NORMAL_CODE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

function normalCodeRank(code: string | undefined): number | null {
  const u = code?.trim().toUpperCase();
  if (u == null || u === "") return null;
  return u in NORMAL_CODE_RANK ? NORMAL_CODE_RANK[u]! : null;
}

/** Parse api.weather.gc.ca climate-normals CSV; keys are `${NORMAL_ID}-${MONTH}` (1–12). */
export function parseClimateNormalsCsv(body: string): Map<string, number> {
  const lines = body.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return new Map();

  const header = parseCsvLine(lines[0]);
  const idx = (name: string): number => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`climate normals CSV missing column: ${name}`);
    return i;
  };

  let iMonth: number;
  let iNormalId: number;
  let iValue: number;
  let iCurrent: number;
  let iNormCode: number;
  try {
    iMonth = idx("MONTH");
    iNormalId = idx("NORMAL_ID");
    iValue = idx("VALUE");
    iCurrent = idx("CURRENT_FLAG");
    iNormCode = idx("NORMAL_CODE");
  } catch {
    return new Map();
  }

  /** Prefer best NORMAL_CODE when multiple rows share the same NORMAL_ID+MONTH (e.g. A over C). */
  const best = new Map<string, { value: number; rank: number }>();

  for (let li = 1; li < lines.length; li++) {
    const row = parseCsvLine(lines[li]);
    if (row.length < header.length) continue;
    if (row[iCurrent] !== "Y") continue;

    const rank = normalCodeRank(row[iNormCode]);
    if (rank == null) continue;

    const month = parseInt(row[iMonth], 10);
    const normalId = parseInt(row[iNormalId], 10);
    const value = parseFloat(row[iValue]);
    if (!Number.isFinite(month) || !Number.isFinite(normalId) || !Number.isFinite(value)) continue;

    const key = `${normalId}-${month}`;
    const prev = best.get(key);
    if (prev == null || rank < prev.rank) {
      best.set(key, { value, rank });
    }
  }

  const map = new Map<string, number>();
  for (const [key, { value }] of best) {
    map.set(key, value);
  }
  return map;
}

function getNormal(values: Map<string, number>, normalId: number, month: number): number | undefined {
  return values.get(`${normalId}-${month}`);
}

const logger = new Logger("Climate_Normals");
const config = initializeConfig();

class ClimateNormals {
  private _apiURL: string;
  private _lastMonthName: string;
  private _normalPrecipForSeason: ClimateNormalSeasonPrecip = { amount: 0, unit: "mm" };
  private _normalsForLastMonth: ClimateNormalsForMonth = {
    temperature: { min: 0, max: 0, mean: 0 },
    precip: { amount: 0 },
  };
  private _fetchedAt: string | null = null;

  constructor() {
    if (!config) return;

    this.initialize();
    eventbus.addListener(EVENT_BUS_CONFIG_CHANGE_CLIMATE_NORMALS, () => this.initialize());
  }

  private initialize() {
    logger.log("Initializing climate normals for station ID:", config.climateNormals.stationID);
    const id = config.climateNormals.climateID;
    this._apiURL = `https://api.weather.gc.ca/collections/climate-normals/items?CLIMATE_IDENTIFIER=${id}&sortby=MONTH&f=csv&limit=10000&offset=0`;
  }

  public fetchClimateNormals(currentDate: Date = new Date()) {
    // store last month name for later use
    this._lastMonthName = format(subMonths(currentDate, 1), "MMM").toLowerCase();

    logger.log("Fetching climate normals");

    axios
      .get(this._apiURL, { responseType: "text" })
      .then((resp) => {
        const data = resp?.data;
        if (data == null || data === "") throw new Error("empty body");

        const raw = typeof data === "string" ? data : String(data);
        if (!looksLikeClimateNormalsCsv(raw)) {
          throw new Error(
            "ECCC climate normals response is not the expected CSV (check CLIMATE_IDENTIFIER / api.weather.gc.ca availability)."
          );
        }

        let values: Map<string, number>;
        try {
          values = parseClimateNormalsCsv(raw);
        } catch (parseErr) {
          throw new Error(`climate normals CSV parse failed: ${formatFetchError(parseErr)}`);
        }
        if (!values.size) {
          logger.warn("Climate normals CSV contained no usable rows");
          return;
        }

        this.applyPrecipNormals(currentDate, values);
        this.applyTempNormals(values);
        this._fetchedAt = new Date().toISOString();
        eventbus.emit(EVENT_BUS_AUXILIARY_WEATHER_DATA_READY);
      })
      .catch((err) => logger.warn(`Climate normals fetch skipped: ${formatFetchError(err)}`))
      .finally(() => logger.log("Climate normals request finished"));
  }

  private applyPrecipNormals(currentDate: Date, values: Map<string, number>) {
    if (!isValid(currentDate)) return;

    const seasonMonths = getShorthandMonthNamesForSeason(true, currentDate);
    const currentMonthAbbr = format(currentDate, "MMM").toLowerCase();

    let normalPrecipForSeason = 0;
    for (const monthAbbr of seasonMonths) {
      const monthNum = MONTH_ABBR_TO_NUM[monthAbbr];
      if (monthNum == null) continue;

      const precipAmount = getNormal(values, NORMAL_ID.totalPrecipMm, monthNum);
      if (precipAmount == null) continue;

      if (monthAbbr === currentMonthAbbr) {
        if (currentDate.getDate() === 1) continue;

        const averageDailyPrecipForCurrentMonth = precipAmount / getDaysInMonth(currentDate);
        normalPrecipForSeason += averageDailyPrecipForCurrentMonth * (currentDate.getDate() - 1);
      } else {
        normalPrecipForSeason += precipAmount;
      }
    }

    this._normalPrecipForSeason.amount = Number(normalPrecipForSeason.toFixed(1));
    logger.log("Processed normal precip for season");

    const lastMonthNum = MONTH_ABBR_TO_NUM[this._lastMonthName];
    const lastPrecip =
      lastMonthNum != null ? getNormal(values, NORMAL_ID.totalPrecipMm, lastMonthNum) : undefined;
    if (lastPrecip != null) {
      this._normalsForLastMonth.precip.amount = Number(Number(lastPrecip).toFixed(1));
    }

    logger.log("Processed normal precip for last month", this._lastMonthName);
  }

  private applyTempNormals(values: Map<string, number>) {
    const lastMonthNum = MONTH_ABBR_TO_NUM[this._lastMonthName];
    if (lastMonthNum == null) return;

    const maxT = getNormal(values, NORMAL_ID.meanDailyMaxTemp, lastMonthNum);
    const minT = getNormal(values, NORMAL_ID.meanDailyMinTemp, lastMonthNum);
    const meanT = getNormal(values, NORMAL_ID.meanDailyTemp, lastMonthNum);

    if (maxT != null) this._normalsForLastMonth.temperature.max = maxT;
    if (minT != null) this._normalsForLastMonth.temperature.min = minT;
    if (meanT != null) this._normalsForLastMonth.temperature.mean = meanT;

    logger.log("Processed normal min/max temps for last month", this._lastMonthName);
  }

  public getNormalPrecipForCurrentSeason() {
    return this._normalPrecipForSeason;
  }

  public getNormalsForLastMonth() {
    return this._normalsForLastMonth;
  }

  public getLastFetchIso(): string | null {
    return this._fetchedAt;
  }

  public requestOperatorRefresh(currentDate: Date = new Date()): void {
    this.fetchClimateNormals(currentDate);
  }
}

let climateNormals: ClimateNormals = null;
export function initializeClimateNormals(forceNewInstance: boolean = false): ClimateNormals {
  if (!forceNewInstance && climateNormals) return climateNormals;

  climateNormals = new ClimateNormals();
  return climateNormals;
}
