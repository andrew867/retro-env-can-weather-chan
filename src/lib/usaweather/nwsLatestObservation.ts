import type { AxiosInstance } from "axios";
import { NWS_GRIDPOINT_FORECAST_USER_AGENT } from "consts/sunspots.consts";
import { generateConditionsUUID } from "lib/eccc/utils";
import { axiosGetWithRetry } from "lib/reliability/httpRetry";

/** Parsed fields aligned with AWC METAR path for airport / USA screens. */
export type NwsLatestObservationParsed = {
  temperatureC: number;
  condition: string;
  conditionUUID: string;
};

/**
 * Latest observation from NWS `api.weather.gov` (ICAO station id, e.g. CYWG or KJFK).
 * Requires a contact User-Agent per api.weather.gov policy.
 */
export async function fetchNwsLatestObservation(
  client: AxiosInstance,
  stationCode: string,
  timeoutMs: number
): Promise<NwsLatestObservationParsed | null> {
  const code = stationCode.trim().toUpperCase();
  if (!code) return null;
  const url = `https://api.weather.gov/stations/${encodeURIComponent(code)}/observations/latest`;
  const resp = await axiosGetWithRetry(client, url, {
    timeout: timeoutMs,
    headers: { "User-Agent": NWS_GRIDPOINT_FORECAST_USER_AGENT },
    rwcUpstream: { feed: "nws_observations_latest", key: code },
  });
  const weather = resp.data as {
    properties?: {
      timestamp?: string;
      textDescription?: string | null;
      temperature?: { value?: number | null } | null;
    };
  };
  const properties = weather?.properties;
  if (!properties?.timestamp) return null;
  const temperature = properties.temperature;
  if (temperature?.value == null || Number.isNaN(Number(temperature.value))) return null;
  const [timestamp] = properties.timestamp.split("+");
  const conditionUUID = generateConditionsUUID(timestamp.replace(/[-T:]/g, ""));
  const text = (properties.textDescription ?? "").trim();
  if (!text) return null;
  return {
    temperatureC: Number(temperature.value),
    condition: text,
    conditionUUID,
  };
}
