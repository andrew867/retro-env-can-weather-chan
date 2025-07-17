import { CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT } from "consts";
import { useEffect, useState } from "react";
import { WeatherStation } from "types";

// tell the channel to fetch the config once every 15mins
export function useWeatherEventStream() {
  const [weatherEventStream, setWeatherEventStream] = useState<EventSource>();
  const [currentConditions, setCurrentConditions] = useState<WeatherStation>();

  useEffect(() => {
    let eventStream = weatherEventStream;

    const connect = () => {
      eventStream = new EventSource("api/v1/weather/live");

      eventStream.addEventListener(CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT, (conditionUpdate) => {
        const parsedConditionUpdate = JSON.parse(conditionUpdate.data) as WeatherStation;
        if (!parsedConditionUpdate) return;

        // if it's the same observation date (down to the min/sec) then skip updating the state because it'll render too much
        setCurrentConditions((existing) => {
          if (parsedConditionUpdate.observationID === existing?.observationID) return existing;

          return parsedConditionUpdate;
        });
      });

      // if we encounter an error, close the stream and try again
      eventStream.onerror = () => {
        eventStream.close();
        setWeatherEventStream(undefined);
      };

      setWeatherEventStream(eventStream);
    };

    if (!eventStream || eventStream.readyState === EventSource.CLOSED) connect();

    return () => {
      eventStream && eventStream.close();
    };
  }, [weatherEventStream]);

  return { currentConditions };
}
