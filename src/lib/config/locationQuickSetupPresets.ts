import { PROVINCE_TRACKING_DEFAULT_STATIONS } from "consts/provincetracking.consts";
import type { ProvinceStations } from "types";

/**
 * Ontario six-city grid used in shipped examples; `mergeProvinceStationClimateDefaults` adds `climateStationId`
 * where we have curated MSC bulk anchors (Toronto, Hamilton, …).
 */
const ONTARIO_PROVINCE_TRACKING_PRESET: ProvinceStations = [
  { name: "Toronto", code: "ON/s0000458" },
  { name: "Ottawa", code: "ON/s0000623" },
  { name: "Hamilton", code: "ON/s0000549" },
  { name: "London", code: "ON/s0000326" },
  { name: "Kitchener", code: "ON/s0000573" },
  { name: "Windsor", code: "ON/s0000646" },
];

/** Province tracking preset for quick setup; `null` when we have no verified list (operator keeps current grid). */
export function getProvinceTrackingPresetForProvince(province: string): ProvinceStations | null {
  const p = String(province ?? "")
    .trim()
    .toUpperCase();
  if (p === "MB") return [...PROVINCE_TRACKING_DEFAULT_STATIONS];
  if (p === "ON") return [...ONTARIO_PROVINCE_TRACKING_PRESET];
  return null;
}
