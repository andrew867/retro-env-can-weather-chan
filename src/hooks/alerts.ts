import { ALERTS_SSE_UPDATE_EVENT } from "consts";
import axios from "lib/axios";
import { getDataFetchedAtHeader } from "lib/fetchMeta";
import { logClientFetchWarning } from "lib/eccc/fetchErrors";
import { isPlainObject } from "lib/display/safeData";
import { CAPObject } from "types";
import { useCallback, useEffect, useState } from "react";

const SSE_RECONNECT_BASE_MS = 2000;
const SSE_RECONNECT_MAX_MS = 60000;
/** Rare safety poll if SSE stays down (CAP also arrives via AMQP on the server). */
export const ALERTS_POLL_FALLBACK_MS = 10 * 60 * 1000;

export function useAlerts() {
  const [alerts, setAlerts] = useState<CAPObject[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [alertsDataFetchedAt, setAlertsDataFetchedAt] = useState<string | null>(null);

  const refetchAlerts = useCallback(async () => {
    try {
      const resp = await axios.get("weather/alerts");
      const raw = (resp.data as { alerts?: unknown })?.alerts;
      setAlerts(Array.isArray(raw) ? (raw as CAPObject[]) : []);
      setAlertsDataFetchedAt(getDataFetchedAtHeader(resp));
    } catch (err) {
      logClientFetchWarning("alerts", err);
    } finally {
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    void refetchAlerts();
  }, [refetchAlerts]);

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
        SSE_RECONNECT_MAX_MS,
        SSE_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt)
      );
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (closed) return;
      clearReconnect();
      es?.close();
      es = new EventSource("api/v1/weather/alerts/stream");

      es.addEventListener(ALERTS_SSE_UPDATE_EVENT, (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as unknown;
          const raw = isPlainObject(parsed) ? (parsed as { alerts?: unknown }).alerts : undefined;
          setAlerts(Array.isArray(raw) ? (raw as CAPObject[]) : []);
          setAlertsDataFetchedAt(new Date().toISOString());
          reconnectAttempt = 0;
        } catch {
          /* ignore malformed payload */
        }
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

    const fallbackTimer = setInterval(() => {
      void refetchAlerts();
    }, ALERTS_POLL_FALLBACK_MS);

    return () => {
      closed = true;
      clearReconnect();
      clearInterval(fallbackTimer);
      es?.close();
    };
  }, [refetchAlerts]);

  return {
    alerts,
    hasFetched,
    mostImportantAlert: alerts[0] ?? null,
    alertsDataFetchedAt,
    refetchAlerts,
  };
}
