import type { AxiosInstance } from "axios";
import backendAxios from "lib/backendAxios";
import { axiosGetWithMscMirror } from "lib/eccc/mscHttpMirror";
import { GetWeatherFileFromECCC, legacyHpfxCitypageEnglishXmlUrl } from "lib/eccc/datamart";
import type { LatLong } from "types";

const Weather = require("ec-weather-js") as new (xml: string) => {
  all?: { location?: { name?: { lat?: string; lon?: string; value?: string } } };
};

/** Match {@link conditions} `parseStationLatLong` compass rules. */
function parseCompassLatLon(latRaw: string, lonRaw: string): LatLong | null {
  const lat = String(latRaw ?? "").trim();
  const lon = String(lonRaw ?? "").trim();
  if (!lat || !lon) return null;

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;

  const latSigned = lat.toUpperCase().includes("N") ? latNum : -latNum;
  const longSigned = lon.toUpperCase().includes("E") ? lonNum : -lonNum;

  if (Math.abs(latSigned) > 90 || Math.abs(longSigned) > 180) return null;
  return { lat: latSigned, long: longSigned };
}

/**
 * Parse MSC citypage XML into WGS84 coordinates (same compass rules as {@link conditions}).
 */
export async function fetchCitypageLatLon(
  province: string,
  locationCode: string,
  axiosInstance: AxiosInstance = backendAxios
): Promise<LatLong | null> {
  const prov = String(province ?? "").trim();
  const loc = String(locationCode ?? "").trim();
  if (!prov || !loc) return null;

  let url = await GetWeatherFileFromECCC(prov, loc);
  if (!url) url = legacyHpfxCitypageEnglishXmlUrl(prov, loc);

  try {
    const { data } = await axiosGetWithMscMirror(axiosInstance, url);
    const raw = typeof data === "string" ? data : String(data ?? "");
    if (!raw.trim()) return null;
    const weather = new Weather(raw);
    const name = weather?.all?.location?.name;
    if (!name || typeof name.lat !== "string" || typeof name.lon !== "string") return null;
    return parseCompassLatLon(name.lat, name.lon);
  } catch {
    return null;
  }
}
