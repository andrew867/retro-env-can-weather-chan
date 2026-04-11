import type { AxiosInstance } from "axios";
import backendAxios from "lib/backendAxios";
import type { LtceVirtualStationSearchHit } from "types";

const LTCE_STATIONS_ITEMS_URL = "https://api.weather.gc.ca/collections/ltce-stations/items";

/**
 * Search MSC LTCE **virtual climate stations** by English area name substring.
 * The OGC API matches `VIRTUAL_STATION_NAME_E` when the query value is passed as that query parameter (prefix / contains behaviour is server-defined; we send uppercase for reliable hits).
 */
export async function searchLtceVirtualStations(
  search: string,
  axiosInstance: AxiosInstance = backendAxios
): Promise<LtceVirtualStationSearchHit[]> {
  const raw = search.trim();
  if (raw.length < 2) return [];

  const url = new URL(LTCE_STATIONS_ITEMS_URL);
  url.searchParams.set("f", "json");
  url.searchParams.set("limit", "200");
  url.searchParams.set("VIRTUAL_STATION_NAME_E", raw.toUpperCase());

  const { data } = await axiosInstance.get<{ features?: unknown[] }>(url.toString(), {
    timeout: 25_000,
    validateStatus: (s) => s === 200,
  });

  const features = Array.isArray(data?.features) ? data.features : [];
  const byId = new Map<string, LtceVirtualStationSearchHit>();

  for (const f of features) {
    if (!f || typeof f !== "object") continue;
    const props = (f as { properties?: Record<string, unknown> }).properties;
    if (!props || typeof props !== "object") continue;
    const virtualClimateId = String(props.VIRTUAL_CLIMATE_ID ?? "").trim();
    if (!virtualClimateId || byId.has(virtualClimateId)) continue;

    byId.set(virtualClimateId, {
      virtualClimateId,
      virtualStationNameEn: String(props.VIRTUAL_STATION_NAME_E ?? "").trim(),
      wxoCityCode: String(props.WXO_CITY_CODE ?? "").trim(),
      provinceCode: String(props.PROVINCE_CODE ?? "").trim(),
    });
  }

  const list = [...byId.values()];
  list.sort((a, b) => a.virtualStationNameEn.localeCompare(b.virtualStationNameEn, "en"));
  return list.slice(0, 40);
}
