/**
 * On-air strings derived from MSC `stationID` + `city`.
 *
 * **Implementation:** rules live in pluggable bundles under `lib/display/plugins/` (see
 * `ecccRetroBroadcast.bundle.ts`). Core call sites import from this file only so new regional packs
 * can ship without editing `Conditions`, `ForecastScreen`, or `outlookScreenBodies`.
 */
import {
  resolveAqhiHeadlineCity,
  resolveConditionsLabelTemplateId,
  resolveOutlookAreaLabel,
} from "./plugins/displayLabelRegistry";

export { resolveConditionsLabelTemplateId };

/** “Outlook for …” fragment — first matching bundle rule wins, else MSC `city`. */
export function getOutlookForAreaLabel(stationID: string, city: string | undefined): string {
  return resolveOutlookAreaLabel({ stationID, city });
}

/** AQHI headline city token — first matching bundle rule wins, else MSC `city`. */
export function getAqhiCityAbbreviation(stationID: string, city: string | undefined): string {
  return resolveAqhiHeadlineCity({ stationID, city });
}

export { isSouthernOntarioOutlookArea } from "./plugins/bundles/ecccRetroBroadcast.bundle";
