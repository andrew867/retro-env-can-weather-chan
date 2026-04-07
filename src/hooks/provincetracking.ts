import { PROVINCE_TRACKING_CLIENT_POLL_MS } from "consts";
import { ProvinceTracking } from "types";
import { usePollingFetch } from "./usePollingFetch";

export function useProvinceTracking() {
  const { data, dataFetchedAt, refetch } = usePollingFetch<ProvinceTracking>(
    "weather/province",
    PROVINCE_TRACKING_CLIENT_POLL_MS,
    "provinceTracking"
  );
  return { provinceTracking: data, provinceDataFetchedAt: dataFetchedAt, refetchProvinceTracking: refetch };
}
