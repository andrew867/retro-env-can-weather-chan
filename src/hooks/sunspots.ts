import { SunspotStationObservations } from "types";
import { usePollingFetch } from "./usePollingFetch";

const FETCH_SUNSPOTS_INTERVAL = 5 * 60 * 1000;

export function useSunspots() {
  const { data, dataFetchedAt, refetch, hasAttempted } = usePollingFetch<SunspotStationObservations>(
    "weather/sunspots",
    FETCH_SUNSPOTS_INTERVAL,
    "sunspots"
  );
  return {
    sunspots: data,
    sunspotsDataFetchedAt: dataFetchedAt,
    refetchSunspots: refetch,
    sunspotsFetchAttempted: hasAttempted,
  };
}
