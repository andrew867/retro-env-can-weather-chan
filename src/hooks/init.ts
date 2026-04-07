import { InitChannel } from "types";
import { usePollingFetch } from "./usePollingFetch";

/** How often the display refetches crawler / flavour / playlist from `GET /api/v1/init`. */
const FETCH_CONFIG_INTERVAL = 5 * 1000;

export function useConfig() {
  const { data: config, refetch, hasAttempted: initAttempted } = usePollingFetch<InitChannel>(
    "init",
    FETCH_CONFIG_INTERVAL,
    "init",
    {
      trackFetchedAt: false,
    }
  );
  return { config, refetchConfig: refetch, initAttempted };
}
