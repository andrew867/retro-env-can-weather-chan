import type { NationalWeather } from "types";

/** If a regional list is empty in `fresh`, substitute from `lkg` when present. */
export function mergeNationalWithLkg(fresh: NationalWeather, lkg: NationalWeather | null): NationalWeather {
  if (!lkg) return fresh;
  return {
    mb: fresh.mb.length ? fresh.mb : lkg.mb,
    on: fresh.on.length ? fresh.on : lkg.on,
    east: fresh.east.length ? fresh.east : lkg.east,
    west: fresh.west.length ? fresh.west : lkg.west,
  };
}
