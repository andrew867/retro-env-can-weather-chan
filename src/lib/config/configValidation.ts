import { Screens } from "consts";
import { MAX_AIRPORT_METAR_STATIONS } from "consts";
import Logger from "lib/logger";

const logger = new Logger("CONFIG");

export type ConfigValidationIssue = { level: "warn" | "error"; message: string };

const ICAO = /^[A-Z0-9]{3,4}$/;

export function validateLoadedConfigJson(parsed: Record<string, unknown>): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  const pl = parsed.primaryLocation as Record<string, unknown> | undefined;
  if (!pl || typeof pl !== "object") {
    issues.push({ level: "error", message: "primaryLocation missing or not an object" });
  } else {
    const prov = pl.province;
    const loc = pl.location;
    if (typeof prov !== "string" || !String(prov).trim()) {
      issues.push({ level: "warn", message: "primaryLocation.province is empty — using defaults may fail" });
    }
    if (typeof loc !== "string" || !String(loc).trim()) {
      issues.push({ level: "warn", message: "primaryLocation.location (station id) is empty" });
    }
  }

  const airports = parsed.airportMetarStations;
  if (airports != null) {
    if (!Array.isArray(airports)) {
      issues.push({ level: "warn", message: "airportMetarStations must be an array when present" });
    } else {
      airports.forEach((row, ix) => {
        if (!row || typeof row !== "object") {
          issues.push({ level: "warn", message: `airportMetarStations[${ix}] is not an object` });
          return;
        }
        const code = (row as { code?: unknown }).code;
        if (typeof code !== "string" || !ICAO.test(code.trim().toUpperCase())) {
          issues.push({
            level: "warn",
            message: `airportMetarStations[${ix}].code must be a 3–4 character ICAO (got ${String(code)})`,
          });
        }
      });
      if (airports.length > MAX_AIRPORT_METAR_STATIONS) {
        issues.push({
          level: "warn",
          message: `airportMetarStations has ${airports.length} entries; only the first ${MAX_AIRPORT_METAR_STATIONS} are used`,
        });
      }
    }
  }

  const misc = parsed.misc as Record<string, unknown> | undefined;
  if (misc && typeof misc === "object" && misc.logLevel !== undefined) {
    const level = String(misc.logLevel).trim().toLowerCase();
    if (!["debug", "notice", "warn", "warning", "error", "critical"].includes(level)) {
      issues.push({
        level: "warn",
        message: `misc.logLevel must be one of debug|notice|warn|error|critical (got ${String(misc.logLevel)})`,
      });
    }
  }

  return issues;
}

export function validateFlavourScreenIds(screens: { id?: unknown }[]): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];
  const maxId = Screens.AIRPORT_METAR;
  const minId = Screens.ALERTS;
  screens.forEach((s, ix) => {
    const id = s?.id;
    if (typeof id !== "number" || !Number.isFinite(id)) {
      issues.push({ level: "warn", message: `flavour screen[${ix}] has invalid id` });
      return;
    }
    if (id < minId || id > maxId) {
      issues.push({
        level: "warn",
        message: `flavour screen[${ix}] id ${id} is outside known Screens range [${minId}, ${maxId}]`,
      });
    }
  });
  return issues;
}

export function logConfigValidationIssues(issues: ConfigValidationIssue[]): void {
  for (const i of issues) {
    if (i.level === "error") logger.error("Config validation:", i.message);
    else logger.warn("Config validation:", i.message);
  }
}
