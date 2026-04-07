import { HotColdSpots } from "types";
import { usePollingFetch } from "./usePollingFetch";

const FETCH_HOT_COLD_SPOT_INTERVAL = 60 * 1000 * 30;

export function useCanadaHotColdSpots() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<HotColdSpots>(
    "weather/hotColdSpots",
    FETCH_HOT_COLD_SPOT_INTERVAL,
    "hotColdSpots"
  );
  return { hotColdSpots: data, hotColdDataFetchedAt: dataFetchedAt, refetchHotColdSpots: refetch };
}
