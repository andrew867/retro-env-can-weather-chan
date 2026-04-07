import { NATIONAL_WEATHER_FETCH_INTERVAL } from "consts";
import { NationalWeather } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useNationalWeather() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<NationalWeather>(
    "weather/national",
    NATIONAL_WEATHER_FETCH_INTERVAL,
    "nationalWeather"
  );
  return { nationalWeather: data, nationalDataFetchedAt: dataFetchedAt, fetchNationalWeather: refetch };
}
