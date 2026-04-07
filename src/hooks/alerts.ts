import { CAPObject } from "types";
import { usePollingFetch } from "./usePollingFetch";

const FETCH_ALERTS_INTERVAL = 3 * 60 * 1000;

export function useAlerts() {
  const { data, dataFetchedAt, hasAttempted, refetch } = usePollingFetch<CAPObject[]>(
    "weather/alerts",
    FETCH_ALERTS_INTERVAL,
    "alerts",
    {
      parseResponse: (resp) => (resp.data as { alerts?: CAPObject[] })?.alerts ?? [],
    }
  );
  const alerts = data ?? [];
  return {
    alerts,
    hasFetched: hasAttempted,
    mostImportantAlert: alerts[0] ?? null,
    alertsDataFetchedAt: dataFetchedAt,
    refetchAlerts: refetch,
  };
}
