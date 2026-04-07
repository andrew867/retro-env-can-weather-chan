import { ConfigFields } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useChannelCurrentConfig() {
  const { data, hasAttempted } = usePollingFetch<ConfigFields>("config", 0, "config", {
    parseResponse: (resp) => {
      const body = resp.data as { config?: ConfigFields } | undefined;
      return body?.config;
    },
    trackFetchedAt: false,
  });
  return { config: data, fetched: hasAttempted };
}
