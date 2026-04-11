import { initializeConfig } from "lib/config";
import Logger from "lib/logger";
import { warnThrottled } from "lib/logger/warnThrottled";
import axios from "lib/backendAxios";
import { formatFetchError, looksLikeClimatedataXml } from "lib/eccc/fetchErrors";
import { ElementCompact, xml2js } from "xml-js";
import {
  HistoricalDataStats,
  HistoricalPrecipData,
  HistoricalTemperatureAlmanac,
  LastMonthDayValue,
  LastMonthSummary,
} from "types";
import { addDays, isSameMonth, isValid, isYesterday, parseISO, subDays, subMonths, subYears } from "date-fns";
import { isDateInCurrentWinterSeason, getIsWinterSeason, isDateInCurrentSummerSeason } from "lib/date";
import eventbus from "lib/eventbus";
import { EVENT_BUS_AUXILIARY_WEATHER_DATA_READY, EVENT_BUS_CONFIG_CHANGE_HISTORICAL_TEMP_PRECIP } from "consts";

function xmlText(el: unknown): string | undefined {
  if (el == null) return undefined;
  if (typeof el === "string" || typeof el === "number") return String(el).trim();
  const o = el as { _text?: string | number };
  if (o._text !== undefined && o._text !== null) return String(o._text).trim();
  return undefined;
}

/** ECCC bulk row: mm liquid equivalent — prefer `totalprecipitation`, else `totalrain`; trace/missing → 0. */
function dailyPrecipitationMm(row: { totalprecipitation?: unknown; totalrain?: unknown }): number {
  const raw = xmlText(row.totalprecipitation) ?? xmlText(row.totalrain);
  if (raw == null || raw === "") return 0;
  const u = raw.toUpperCase();
  if (u === "T" || u === "M") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function dailySnowCm(row: { totalsnow?: unknown }): number {
  const raw = xmlText(row.totalsnow);
  if (raw == null || raw === "") return 0;
  const u = raw.toUpperCase();
  if (u === "T" || u === "M") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const logger = new Logger("Historical_Temp_Precip");
const config = initializeConfig();

class HistoricalTempPrecip {
  private _apiURL: string;
  private _historicalData: any[] = [];
  private _fetchBusy = false;
  private _fetchPendingDate: Date | null = null;
  /** Set when the most recent `fetchLastTwoYearsOfData` batch finished (success or partial failure). */
  private _lastBulkFetchCompletedAt: string | null = null;

  private _lastYearTemperatures: HistoricalTemperatureAlmanac = { min: null, max: null };
  private _seasonPrecipData: HistoricalPrecipData = { amount: 0, normal: 0, unit: "mm", type: "rain" };
  private _yesterdayPrecipData: HistoricalPrecipData = { amount: null, normal: 0, unit: "mm", type: "rain" };
  private _yesterdaySnowData: HistoricalPrecipData = { amount: null, normal: 0, unit: "cm", type: "snow" };
  private _lastMonthSummary: LastMonthSummary = null;

  constructor() {
    if (!config) return;

    this.initialize();
    eventbus.addListener(EVENT_BUS_CONFIG_CHANGE_HISTORICAL_TEMP_PRECIP, () => this.initialize());
  }

  private initialize() {
    logger.log("Initializing historical data for station ID:", config.historicalDataStationID);
    // ECCC now returns HTML unless Month/Day anchor the request (timeframe=2 = annual daily).
    this._apiURL = `https://climate.weather.gc.ca/climate_data/bulk_data_e.html?format=xml&stationID=${config.historicalDataStationID}&Year=$YEAR&Month=1&Day=1&timeframe=2`;
  }

  public fetchLastTwoYearsOfData(currentDate: Date = new Date()) {
    if (this._fetchBusy) {
      this._fetchPendingDate = currentDate;
      return;
    }
    this._fetchBusy = true;

    const currentYear = currentDate.getFullYear();
    const yearsToFetch = [currentYear - 1, currentYear];
    logger.log("Preparing to fetch historical data for years", yearsToFetch.join());

    this._historicalData.splice(0, this._historicalData.length);

    const promises: Promise<any>[] = [];
    yearsToFetch.forEach((year) => {
      logger.log("Fetching historical data for", year);

      promises.push(
        axios
          .get(this._apiURL.replace("$YEAR", year.toString()), { responseType: "text" })
          .then((resp) => {
            const { data } = resp ?? {};
            if (data == null || data === "") throw new Error("empty body");

            const raw = typeof data === "string" ? data : String(data);
            if (!looksLikeClimatedataXml(raw)) {
              throw new Error("response is not climatedata XML (check station ID / ECCC availability)");
            }

            let historicalDataAsJSObject: ElementCompact;
            try {
              historicalDataAsJSObject = xml2js(raw, { compact: true }) as ElementCompact;
            } catch (parseErr) {
              throw new Error(`XML parse failed: ${formatFetchError(parseErr)}`);
            }
            if (!historicalDataAsJSObject) throw new Error("Unable to convert to JS object");

            const climateData = historicalDataAsJSObject["climatedata"];
            if (!climateData) throw new Error("No climate data root");

            const stationData = climateData["stationdata"];
            if (!stationData) throw new Error("No station data");

            const rows = Array.isArray(stationData) ? stationData : [stationData];
            this._historicalData.push(...rows);

            logger.log("Fetched historical data for", year);
          })
          .catch((err) =>
            warnThrottled(`historical_bulk_${year}_${formatFetchError(err)}`, 90_000, () =>
              logger.warn(`Historical bulk data for ${year} skipped: ${formatFetchError(err)}`)
            )
          )
      );
    });

    Promise.allSettled(promises).then(() => {
      this.parseHistoricalStationData(currentDate);
      this._fetchBusy = false;
      this._lastBulkFetchCompletedAt = new Date().toISOString();
      eventbus.emit(EVENT_BUS_AUXILIARY_WEATHER_DATA_READY);
      if (this._fetchPendingDate) {
        const next = this._fetchPendingDate;
        this._fetchPendingDate = null;
        this.fetchLastTwoYearsOfData(next);
      }
    });
  }

  public getLastBulkFetchCompletedIso(): string | null {
    return this._lastBulkFetchCompletedAt;
  }

  public hasAnyBulkRows(): boolean {
    return this._historicalData.length > 0;
  }

  private parseHistoricalStationData(currentDate: Date) {
    this.parseLastYearTemperatures(currentDate);
    this.parseSeasonalPrecip(currentDate);
  }

  private parseLastYearTemperatures(currentDate: Date) {
    if (!this._historicalData?.length) return;
    if (!isValid(currentDate)) return;

    /** Clear before each parse so a miss does not leave a previous station/day’s values on screen. */
    this._lastYearTemperatures = { min: null, max: null };

    /** Same calendar anchor as `observedDateTimeAtStation()` (already offset); try ±1 day for DST / midnight edge cases. */
    const base = subYears(currentDate, 1);
    if (!isValid(base)) return;

    const candidates = [base, subDays(base, 1), addDays(base, 1)];
    let row: (typeof this._historicalData)[0] | undefined;
    for (const cand of candidates) {
      if (!isValid(cand)) continue;
      const hit = this._historicalData.find(
        (stationData) =>
          Number(stationData._attributes.day) === cand.getDate() &&
          Number(stationData._attributes.month) === cand.getMonth() + 1 &&
          Number(stationData._attributes.year) === cand.getFullYear()
      );
      if (hit) {
        row = hit;
        break;
      }
    }
    if (!row) return;

    const maxV = Number(xmlText(row.maxtemp) ?? NaN);
    const minV = Number(xmlText(row.mintemp) ?? NaN);
    this._lastYearTemperatures.max = Number.isFinite(maxV) ? { value: maxV, unit: "C" } : null;
    this._lastYearTemperatures.min = Number.isFinite(minV) ? { value: minV, unit: "C" } : null;
  }

  private parseSeasonalPrecip(currentDate: Date) {
    if (!this._historicalData?.length) return;

    // make sure the date is valid
    if (!isValid(currentDate)) return;

    logger.log("Calculating precip data for the season/yesterday");

    // store data from last month so we can process last month's data quicker
    const lastMonthData: HistoricalDataStats = [];
    const lastMonth = subMonths(currentDate, 1);

    // precip data can spread across this year and last year during the winter so we need to loop through the entire thing
    const isWinterSeason = getIsWinterSeason(currentDate.getMonth() + 1);
    let rainfall = 0;
    let yesterdayRainfall = 0;
    let yesterdaySnowfall = 0;
    this._historicalData?.forEach((historicalData) => {
      if (!historicalData?._attributes) return;

      const {
        _attributes: { year, month, day },
      } = historicalData;

      const y = String(year);
      const m = String(month).padStart(2, "0");
      const d = String(day).padStart(2, "0");
      const date = `${y}-${m}-${d}`;
      const isThisYear = Number(y) === currentDate.getFullYear();

      // if the date is from the last month we'll store this so we can process last month's stats
      if (isSameMonth(parseISO(date), lastMonth)) lastMonthData.push(historicalData);

      // Use observed `currentDate` for season windows so bulk-data sums match the station’s “today”, not only the server clock.
      if (isWinterSeason) {
        if (isDateInCurrentWinterSeason(date, currentDate)) rainfall += dailyPrecipitationMm(historicalData);
      } else if (isDateInCurrentSummerSeason(date, currentDate) && isThisYear) {
        rainfall += dailyPrecipitationMm(historicalData);
      }

      if (isYesterday(parseISO(date))) {
        yesterdayRainfall = Number(dailyPrecipitationMm(historicalData).toFixed(1));
        yesterdaySnowfall = Number(dailySnowCm(historicalData).toFixed(1));
      }
    });

    // now we can store the total amount for the season
    this._seasonPrecipData.amount = Number(rainfall.toFixed(1));
    this._seasonPrecipData.season = isWinterSeason ? "winter" : "summer";

    // and the total amount for yesterday
    this._yesterdayPrecipData.amount = yesterdayRainfall;
    this._yesterdaySnowData.amount = yesterdaySnowfall;

    logger.log("Calculated precip data for the season/yesterday");

    // process last month's stats
    this.processLastMonthsStats(lastMonthData);
  }

  private processLastMonthsStats(lastMonthData: HistoricalDataStats) {
    if (!lastMonthData?.length) {
      this._lastMonthSummary = null;
      return;
    }

    logger.log("Generating last month summary");

    const highTemps: LastMonthDayValue[] = [];
    const lowTemps: LastMonthDayValue[] = [];
    const meanTemps: LastMonthDayValue[] = [];
    const precipValues: LastMonthDayValue[] = [];

    // loop through and grab all of the high/low temps and precip values
    lastMonthData.forEach((dayOfLastMonth) => {
      const maxTemp = Number(xmlText(dayOfLastMonth.maxtemp) ?? NaN);
      const minTemp = Number(xmlText(dayOfLastMonth.mintemp) ?? NaN);
      const meanTemp = Number(xmlText(dayOfLastMonth.meantemp) ?? NaN);

      const day = Number(dayOfLastMonth._attributes.day);
      if (!isNaN(maxTemp)) highTemps.push({ day, value: maxTemp });
      if (!isNaN(minTemp)) lowTemps.push({ day, value: minTemp });
      if (!isNaN(meanTemp)) meanTemps.push({ day, value: meanTemp });

      precipValues.push({ day, value: dailyPrecipitationMm(dayOfLastMonth) });
    });

    // calculate the average high/low and mean
    const averageHigh = highTemps.reduce((acc, curr) => (acc += curr.value), 0) / highTemps.length;
    const averageLow = lowTemps.reduce((acc, curr) => (acc += curr.value), 0) / lowTemps.length;
    const averageTemp = meanTemps.reduce((acc, curr) => (acc += curr.value), 0) / meanTemps.length;

    // calculate the total precip
    const totalPrecip = precipValues.reduce((acc, curr) => (acc += curr.value), 0);

    // figure out the warmest day
    const [, warmestDayIx] = highTemps.reduce(
      (acc, curr, ix) => (curr.value > acc[0] ? [curr.value, ix] : acc),
      [Math.max(), -1]
    );
    const warmestDay = highTemps[warmestDayIx];

    // figure out the coldest day
    const [, coldestDayIx] = lowTemps.reduce(
      (acc, curr, ix) => (curr.value < acc[0] ? [curr.value, ix] : acc),
      [Math.min(), -1]
    );
    const coldestDay = lowTemps[coldestDayIx];

    // store this for use later
    this._lastMonthSummary = {
      averageHigh,
      averageLow,
      averageTemp,
      totalPrecip,
      warmestDay,
      coldestDay,
    };
  }

  public lastYearTemperatures() {
    return this._lastYearTemperatures;
  }

  public seasonPrecipData() {
    return this._seasonPrecipData;
  }

  public yesterdayPrecipData() {
    return this._yesterdayPrecipData;
  }

  public yesterdaySnowData() {
    return this._yesterdaySnowData;
  }

  public lastMonthSummary() {
    return this._lastMonthSummary;
  }
}

let historicalTempPrecip: HistoricalTempPrecip = null;
export function initializeHistoricalTempPrecip(): HistoricalTempPrecip {
  if (process.env.NODE_ENV === "test") return new HistoricalTempPrecip();
  if (historicalTempPrecip) return historicalTempPrecip;

  historicalTempPrecip = new HistoricalTempPrecip();
  return historicalTempPrecip;
}
