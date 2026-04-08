import {
  CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT,
  CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT,
} from "consts";
import { useEffect, useRef, useState } from "react";
import { WeatherStation } from "types";

const SSE_RECONNECT_BASE_MS = 2000;
const SSE_RECONNECT_MAX_MS = 60000;

export type WeatherEventStreamOptions = {
  /**
   * Called every time the EventSource opens, including first connect and after reconnect.
   * Use to refetch polled feeds so footer freshness headers catch up right after the API is back.
   */
  onStreamConnected?: () => void;
};

export function useWeatherEventStream(options?: WeatherEventStreamOptions) {
  const onConnectedRef = useRef(options?.onStreamConnected);
  onConnectedRef.current = options?.onStreamConnected;
  const [currentConditions, setCurrentConditions] = useState<WeatherStation>();

  useEffect(() => {
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
      es = new EventSource("api/v1/weather/live");

      es.addEventListener(CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT, (conditionUpdate) => {
        try {
          const parsed = JSON.parse(conditionUpdate.data) as WeatherStation;
          if (!parsed) return;
          setCurrentConditions((prev) => {
            // Same observation hour can still get a new `fetchedAt` after server restart/reparse; merge so the stale footer clears.
            if (prev && parsed.observationID === prev.observationID) {
              return { ...prev, ...parsed };
            }
            return parsed;
          });
        } catch {
          /* ignore malformed payload */
        }
      });

      es.addEventListener(CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT, (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as Partial<WeatherStation> & {
            forecast?: WeatherStation["forecast"];
            fetchedAt?: string | null;
          };
          setCurrentConditions((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              observationID: parsed.observationID ?? prev.observationID,
              stationTime: parsed.stationTime ?? prev.stationTime,
              forecast: parsed.forecast ?? prev.forecast,
              fetchedAt: parsed.fetchedAt ?? prev.fetchedAt,
            };
          });
        } catch {
          /* ignore malformed payload */
        }
      });

      es.onopen = () => {
        reconnectAttempt = 0;
        onConnectedRef.current?.();
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

  return { currentConditions };
}
