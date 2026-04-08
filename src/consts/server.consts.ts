import { RWC_DATA_FETCHED_AT_HEADER } from "./http.consts";

const cliArgumentPortIx = process.argv.indexOf("--port");

export const API_PORT = cliArgumentPortIx > -1 ? Number(process.argv[cliArgumentPortIx + 1]) : 8600;

/** Browsers only expose custom response headers to JS on cross-origin requests if listed here. */
export const CORS_OPTIONS = {
  /** Local dev: any localhost / 127.0.0.1 port (display + API often differ from :3000). */
  origin:
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i,
  exposedHeaders: [RWC_DATA_FETCHED_AT_HEADER],
  optionsSuccessStatus: 200,
};

export const DEFAULT_WEATHER_STATION_ID = "s0000193";

export const PROVINCE_LIST = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NT", name: "Northwest Territories" },
  { code: "YT", name: "Yukon" },
  { code: "NU", name: "Nunavut" },
];
