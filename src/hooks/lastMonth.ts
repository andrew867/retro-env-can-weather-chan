import { LastMonth } from "types";
import { usePollingFetch } from "./usePollingFetch";

const FETCH_LAST_MONTH_INTERVAL_MS = 15 * 60 * 1000;

export function useLastMonth() {
  const { data, dataFetchedAt, refetch, hasAttempted } = usePollingFetch<LastMonth>(
    "season/lastmonth",
    FETCH_LAST_MONTH_INTERVAL_MS,
    "lastMonth"
  );
  return {
    lastMonth: data,
    lastMonthDataFetchedAt: dataFetchedAt,
    fetchLastMonth: refetch,
    lastMonthFetchAttempted: hasAttempted,
  };
}
