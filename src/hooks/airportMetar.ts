import { AIRPORT_METAR_FETCH_INTERVAL_MS } from "consts";
import { NationalStationObservations } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useAirportMetar() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<NationalStationObservations>(
    "weather/airport-metar",
    AIRPORT_METAR_FETCH_INTERVAL_MS,
    "airportMetar"
  );
  return { airportMetar: data, airportMetarDataFetchedAt: dataFetchedAt, fetchAirportMetar: refetch };
}
