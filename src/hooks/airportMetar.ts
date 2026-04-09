import { AIRPORT_METAR_FETCH_INTERVAL_MS } from "consts";
import type { AxiosResponse } from "axios";
import { NationalStationObservations } from "types";
import { useCallback } from "react";
import { usePollingFetch } from "./usePollingFetch";

function parseAirportMetarResponse(resp: AxiosResponse<unknown>): NationalStationObservations {
  const d = resp.data;
  return Array.isArray(d) ? (d as NationalStationObservations) : [];
}

export function useAirportMetar() {
  const parseResponse = useCallback((resp: AxiosResponse<unknown>) => parseAirportMetarResponse(resp), []);
  const { data, dataFetchedAt, refetch } = usePollingFetch<NationalStationObservations>(
    "weather/airport-metar",
    AIRPORT_METAR_FETCH_INTERVAL_MS,
    "airportMetar",
    { parseResponse }
  );
  return { airportMetar: data, airportMetarDataFetchedAt: dataFetchedAt, fetchAirportMetar: refetch };
}
