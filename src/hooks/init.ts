import { INIT_SSE_CRAWLER_EVENT } from "consts";
import { InitChannel } from "types";
import { useEffect, useRef } from "react";
import { usePollingFetch } from "./usePollingFetch";

/**
 * How often the display refetches crawler / flavour / playlist from `GET /api/v1/init`.
 * Crawler lines also push over `GET /api/v1/init/stream` (SSE `crawler_update`), so this can stay relaxed.
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
      es = new EventSource("api/v1/init/stream");

      es.addEventListener(INIT_SSE_CRAWLER_EVENT, () => {
        refetchRef.current();
      });

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
