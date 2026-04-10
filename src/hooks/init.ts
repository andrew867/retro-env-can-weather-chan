import { INIT_SSE_CRAWLER_EVENT, INIT_SSE_INIT_REFRESH_EVENT } from "consts";
import { InitChannel } from "types";
import { useEffect, useRef } from "react";
import { usePollingFetch } from "./usePollingFetch";

/**
 * How often the display refetches crawler / flavour / playlist from `GET /api/v1/init`.
 * Crawler and graphics saves push over `GET /api/v1/init/stream` (`crawler_update`, `init_refresh`), so this can stay relaxed.
 */
const FETCH_CONFIG_INTERVAL = 30 * 1000;

const INIT_SSE_RECONNECT_BASE_MS = 2000;
const INIT_SSE_RECONNECT_MAX_MS = 60000;

export function useConfig() {
  const { data: config, refetch, hasAttempted: initAttempted } = usePollingFetch<InitChannel>(
    "init",
    FETCH_CONFIG_INTERVAL,
    "init",
    {
      trackFetchedAt: false,
    }
  );

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    let closed = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempt = 0;

    const clearReconnect = () => {
      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    };

    const scheduleReconnect = () => {
      if (closed) return;
      clearReconnect();
      const delay = Math.min(
        INIT_SSE_RECONNECT_MAX_MS,
        INIT_SSE_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt)
      );
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (closed) return;
      clearReconnect();
      es?.close();
      es = new EventSource(`${window.location.origin}/api/v1/init/stream`);

      const bumpInit = () => {
        refetchRef.current();
      };
      es.addEventListener(INIT_SSE_CRAWLER_EVENT, bumpInit);
      es.addEventListener(INIT_SSE_INIT_REFRESH_EVENT, bumpInit);

      es.onopen = () => {
        reconnectAttempt = 0;
      };

      es.onerror = () => {
        es?.close();
        es = null;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closed = true;
      clearReconnect();
      es?.close();
    };
  }, []);

  return { config, refetchConfig: refetch, initAttempted };
}
