import { Season } from "types";
import { usePollingFetch } from "./usePollingFetch";

/** Season flags rarely change; still poll so a dead SSE stream does not strand this data. */
const FETCH_SEASON_INTERVAL_MS = 15 * 60 * 1000;

export function useSeason() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<Season>(
    "season",
    FETCH_SEASON_INTERVAL_MS,
    "season"
  );
  return { season: data, seasonDataFetchedAt: dataFetchedAt, fetchSeason: refetch };
}
