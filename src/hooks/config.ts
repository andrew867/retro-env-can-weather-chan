import { ConfigFields } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useChannelCurrentConfig() {
  const { data, hasAttempted } = usePollingFetch<ConfigFields>("config", 0, "config", {
    parseResponse: (resp) => (resp.data as { config: ConfigFields }).config,
    trackFetchedAt: false,
  });
  return { config: data, fetched: hasAttempted };
}
