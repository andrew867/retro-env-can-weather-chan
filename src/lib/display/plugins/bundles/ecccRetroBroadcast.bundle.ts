import { DEFAULT_WEATHER_STATION_ID } from "consts";
import type {
  AqhiHeadlineCityRule,
  ConditionsLabelTemplateRule,
  DisplayLabelBundle,
  DisplayLabelStationContext,
  OutlookAreaLabelRule,
} from "../displayLabelPlugin.types";

/** Primary citypage sites that used the “southern manitoba” regional outlook line (default bundle). */
export const ECCC_RETRO_WINNIPEG_OUTLOOK_STATION_IDS: readonly string[] = [DEFAULT_WEATHER_STATION_ID];

/**
 * MSC site codes (siteList) that used the “southern ontario” regional outlook line.
 * Operators may extend by registering another bundle with higher-priority rules.
 */
export const ECCC_RETRO_SOUTHERN_ONTARIO_OUTLOOK_STATION_IDS: readonly string[] = [
  "s0000367", // Oakville
  "s0000368", // Burlington
  "s0000549", // Hamilton
  "s0000789", // Halton Hills
];

/** When the station id is unknown, infer Halton / Hamilton belt from MSC `city` text (substring match). */
export const ECCC_RETRO_SOUTHERN_ONTARIO_CITY_SUBSTRINGS: readonly string[] = [
  "oakville",
  "burlington",
  "hamilton",
  "halton hills",
];

/** NL St. John’s citypage codes for AQHI short token (airport-style plate). */
export const ECCC_RETRO_ST_JOHNS_AQHI_STATION_IDS: readonly string[] = ["NL/s0000280", "s0000280"];

function cityLower(ctx: DisplayLabelStationContext): string {
  return (ctx.city ?? "").toLowerCase();
}

function impliesSouthernOntarioByCity(ctx: DisplayLabelStationContext): boolean {
  const c = cityLower(ctx);
  return ECCC_RETRO_SOUTHERN_ONTARIO_CITY_SUBSTRINGS.some((s) => c.includes(s));
}

function stationInList(stationID: string, list: readonly string[]): boolean {
  return list.includes(stationID);
}

export function isSouthernOntarioOutlookArea(stationID: string, city: string | undefined): boolean {
  const ctx: DisplayLabelStationContext = { stationID, city };
  return stationInList(stationID, ECCC_RETRO_SOUTHERN_ONTARIO_OUTLOOK_STATION_IDS) || impliesSouthernOntarioByCity(ctx);
}

function isStJohnsNl(ctx: DisplayLabelStationContext): boolean {
  if (ECCC_RETRO_ST_JOHNS_AQHI_STATION_IDS.includes(ctx.stationID)) return true;
  const c = cityLower(ctx);
  return c.includes("st. john") || c.includes("st john");
}

const outlookRules: readonly OutlookAreaLabelRule[] = [
  {
    id: "eccc-retro-winnipeg-outlook",
    priority: 50,
    applies: (ctx) => stationInList(ctx.stationID, ECCC_RETRO_WINNIPEG_OUTLOOK_STATION_IDS),
    getFragment: () => "southern manitoba",
  },
  {
    id: "eccc-retro-southern-ontario-outlook",
    priority: 40,
    applies: (ctx) => isSouthernOntarioOutlookArea(ctx.stationID, ctx.city),
    getFragment: () => "southern ontario",
  },
];

const aqhiRules: readonly AqhiHeadlineCityRule[] = [
  {
    id: "eccc-retro-st-johns-aqhi",
    priority: 60,
    applies: (ctx) => isStJohnsNl(ctx),
    getShortCity: () => "YYT",
  },
  {
    id: "eccc-retro-winnipeg-aqhi",
    priority: 50,
    applies: (ctx) => stationInList(ctx.stationID, ECCC_RETRO_WINNIPEG_OUTLOOK_STATION_IDS),
    getShortCity: () => "WPG",
  },
  {
    id: "eccc-retro-southern-ontario-aqhi",
    priority: 40,
    applies: (ctx) => isSouthernOntarioOutlookArea(ctx.stationID, ctx.city),
    getShortCity: () => "YHM",
  },
];

const templateRules: readonly ConditionsLabelTemplateRule[] = [
  {
    id: "eccc-retro-winnipeg-template",
    priority: 50,
    applies: (ctx) => stationInList(ctx.stationID, ECCC_RETRO_WINNIPEG_OUTLOOK_STATION_IDS),
    getTemplateId: () => "eccc-retro-winnipeg",
  },
  {
    id: "eccc-retro-southern-ontario-template",
    priority: 40,
    applies: (ctx) => isSouthernOntarioOutlookArea(ctx.stationID, ctx.city),
    getTemplateId: () => "eccc-retro-southern-ontario",
  },
];

/** Default “retro cable” label pack — data tables + rules only; core UI reads via {@link ../displayLabelRegistry}. */
export const ecccRetroBroadcastBundle: DisplayLabelBundle = {
  bundleId: "eccc-retro-broadcast",
  outlookAreaRules: outlookRules,
  aqhiHeadlineRules: aqhiRules,
  conditionsTemplateRules: templateRules,
};
