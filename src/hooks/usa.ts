import { USA_WEATHER_FETCH_INTERVAL } from "consts";
import { USAStationObservations } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useUSAWeather() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<USAStationObservations>(
    "weather/usa",
    USA_WEATHER_FETCH_INTERVAL,
    "usaWeather"
  );
  return { usaWeather: data, usaDataFetchedAt: dataFetchedAt, fetchUSAWeather: refetch };
}
