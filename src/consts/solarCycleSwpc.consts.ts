/** NOAA Space Weather Prediction Center JSON (public HTTPS). */
export const SWPC_OBSERVED_SSN_JSON_URL =
  "https://services.swpc.noaa.gov/json/solar-cycle/swpc_observed_ssn.json";

export const SWPC_OBSERVED_SOLAR_CYCLE_INDICES_JSON_URL =
  "https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json";

export const SWPC_PREDICTED_SOLAR_CYCLE_JSON_URL =
  "https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json";

/** ~1 MB combined per refresh; poll less often than MSC flux. */
export const SOLAR_CYCLE_SWPC_POLL_MS = 3 * 60 * 60 * 1000;
