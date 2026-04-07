import { CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT } from "consts";
import { useEffect, useState } from "react";
import { WeatherStation } from "types";

const SSE_RECONNECT_BASE_MS = 2000;
const SSE_RECONNECT_MAX_MS = 60000;

export function useWeatherEventStream() {
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
            if (parsed.observationID === prev?.observationID) return prev;
            return parsed;
          });
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

    return () => {
      closed = true;
      clearReconnect();
      es?.close();
    };
  }, []);

  return { currentConditions };
}
