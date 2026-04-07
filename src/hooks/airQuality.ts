import type { AxiosResponse } from "axios";
import { useCallback } from "react";
import { AQHIObservationResponse } from "types";
import { usePollingFetch } from "./usePollingFetch";

const FETCH_AIR_QUALITY_INTERVAL = 60 * 1000 * 15;

export function useAirQuality() {
  const parseResponse = useCallback((resp: AxiosResponse<unknown>) => {
    const data = resp.data as AQHIObservationResponse | null;
    if (data == null) return null;
    if (data.value == null || Number.isNaN(Number(data.value))) return null;
    return data;
  }, []);

  const { data, dataFetchedAt, refetch } = usePollingFetch<AQHIObservationResponse>(
    "airquality",
    FETCH_AIR_QUALITY_INTERVAL,
    "airQuality",
    { parseResponse }
  );

  return { airQuality: data, airQualityDataFetchedAt: dataFetchedAt, refetchAirQuality: refetch };
}
