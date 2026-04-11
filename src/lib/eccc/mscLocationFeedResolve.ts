import type { AxiosInstance } from "axios";
import type { AirportMetarStation, ECCCWeatherStation } from "types";
import type {
  LocationFeedAqhiSuggestion,
  LocationFeedClimateSuggestion,
  LocationFeedLtceSuggestion,
  LocationFeedResolveFlags,
  LocationFeedSuggestions,
  MetarHeuristic,
} from "types/locationFeed.types";
import type { LatLong } from "types";
import backendAxios from "lib/backendAxios";
import { MAX_AIRPORT_METAR_STATIONS } from "consts";
import { fetchCitypageLatLon } from "lib/eccc/citypageLatLon";
import { bboxAroundPoint, haversineKm } from "lib/eccc/locationFeedGeo";

const MSC_OGC = "https://api.weather.gc.ca";

type GeoJsonFeature = {
  type?: string;
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
};

const NORMAL_CODE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

function normalCodeRank(code: string | undefined): number {
  const u = code?.trim().toUpperCase() ?? "";
  return u in NORMAL_CODE_RANK ? NORMAL_CODE_RANK[u]! : 9;
}

function pointFromGeometry(f: GeoJsonFeature): LatLong | null {
  const c = f.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const long = Number(c[0]);
  const lat = Number(c[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(long)) return null;
  return { lat, long };
}

async function fetchCollectionFeatures(
  collection: string,
  bbox: [number, number, number, number],
  axiosInstance: AxiosInstance,
  limit: number
): Promise<GeoJsonFeature[]> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const url = `${MSC_OGC}/collections/${encodeURIComponent(collection)}/items?bbox=${minLon},${minLat},${maxLon},${maxLat}&f=json&limit=${limit}`;
  const { data } = await axiosInstance.get<{ features?: unknown[] }>(url, {
    timeout: 35_000,
    validateStatus: (s) => s === 200,
  });
  const features = Array.isArray(data?.features) ? data.features : [];
  return features.filter((x): x is GeoJsonFeature => x != null && typeof x === "object");
}

async function nearestClimateFromPoint(
  origin: LatLong,
  axiosInstance: AxiosInstance
): Promise<LocationFeedClimateSuggestion | null> {
  for (const pad of [0.45, 0.95, 2.0, 4.0]) {
    const bbox = bboxAroundPoint(origin.lat, origin.long, pad);
    let features: GeoJsonFeature[];
    try {
      features = await fetchCollectionFeatures("climate-stations", bbox, axiosInstance, 250);
    } catch {
      continue;
    }

    type Cand = LocationFeedClimateSuggestion;
    const cands: Cand[] = [];

    for (const f of features) {
      const p = f.properties ?? {};
      if (p.HAS_HOURLY_DATA !== "Y" || p.HAS_NORMALS_DATA !== "Y") continue;
      const pt = pointFromGeometry(f);
      if (!pt) continue;
      const stnId = Number(p.STN_ID);
      const climRaw = String(p.CLIMATE_IDENTIFIER ?? "").trim();
      const climateId = Number.parseInt(climRaw, 10);
      if (!Number.isFinite(stnId) || stnId <= 0 || !Number.isFinite(climateId) || climateId <= 0) continue;
      const name = String(p.STATION_NAME ?? "").trim() || `Station ${stnId}`;
      const dist = haversineKm(origin, pt);
      const normalCode = String(p.NORMAL_CODE ?? "").trim();
      cands.push({
        historicalDataStationID: Math.round(stnId),
        climateNormalsClimateID: climateId,
        climateNormalsStationID: Math.round(stnId),
        stationName: name,
        normalCode,
        distanceKm: dist,
      });
    }

    if (!cands.length) continue;

    cands.sort((a, b) => {
      const ra = normalCodeRank(a.normalCode);
      const rb = normalCodeRank(b.normalCode);
      if (ra !== rb) return ra - rb;
      return a.distanceKm - b.distanceKm;
    });
    return cands[0] ?? null;
  }
  return null;
}

async function nearestLtceFromPoint(
  origin: LatLong,
  axiosInstance: AxiosInstance
): Promise<LocationFeedLtceSuggestion | null> {
  const byId = new Map<string, { name: string; dist: number }>();

  for (const pad of [0.35, 0.8, 1.8, 4.0]) {
    const bbox = bboxAroundPoint(origin.lat, origin.long, pad);
    let features: GeoJsonFeature[];
    try {
      features = await fetchCollectionFeatures("ltce-stations", bbox, axiosInstance, 120);
    } catch {
      continue;
    }

    for (const f of features) {
      const p = f.properties ?? {};
      const id = String(p.VIRTUAL_CLIMATE_ID ?? "").trim();
      const name = String(p.VIRTUAL_STATION_NAME_E ?? "").trim();
      const pt = pointFromGeometry(f);
      if (!id || !pt) continue;
      const dist = haversineKm(origin, pt);
      const prev = byId.get(id);
      if (!prev || dist < prev.dist) {
        byId.set(id, { name: name || id, dist });
      }
    }

    if (byId.size) break;
  }

  if (!byId.size) return null;
  let best: { id: string; name: string; dist: number } | null = null;
  for (const [id, v] of byId) {
    if (!best || v.dist < best.dist) best = { id, name: v.name, dist: v.dist };
  }
  return best ? { virtualClimateId: best.id, virtualStationNameEn: best.name, distanceKm: best.dist } : null;
}

async function nearestAqhiFromPoint(
  origin: LatLong,
  axiosInstance: AxiosInstance
): Promise<LocationFeedAqhiSuggestion | null> {
  let best: LocationFeedAqhiSuggestion | null = null;

  for (const pad of [0.35, 0.75, 1.5, 3.5]) {
    const bbox = bboxAroundPoint(origin.lat, origin.long, pad);
    let features: GeoJsonFeature[];
    try {
      features = await fetchCollectionFeatures("aqhi-stations", bbox, axiosInstance, 80);
    } catch {
      continue;
    }

    for (const f of features) {
      const p = f.properties ?? {};
      const zone = String(p["eccc_administrative-zone"] ?? "").trim().toLowerCase();
      const locId = String(p.location_id ?? "").trim();
      const nameEn = String(p.location_name_en ?? "").trim();
      const pt = pointFromGeometry(f);
      if (!zone || !locId || !pt) continue;
      const dist = haversineKm(origin, pt);
      const key = `${zone}/${locId}`;
      const row: LocationFeedAqhiSuggestion = { stationKey: key, locationNameEn: nameEn || locId, distanceKm: dist };
      if (!best || row.distanceKm < best.distanceKm) best = row;
    }

    if (best) break;
  }
  return best;
}

function isCanadianMetarIcao(code: string): boolean {
  return /^C[A-Z0-9]{3}$/.test(code);
}

function metarInterestBonus(name: string): number {
  const n = name.toUpperCase();
  let b = 0;
  if (/(INTERNATIONAL|INT'L|INTL)/.test(n)) b += 38;
  if (/(PEARSON|TRUDEAU|MACDONALD|CARTIER|LOGAN|VANCOUVER INT|CALGARY INT|EDMONTON INT)/.test(n)) b += 24;
  return b;
}

async function metarStationsFromPoint(
  origin: LatLong,
  heuristic: MetarHeuristic,
  axiosInstance: AxiosInstance
): Promise<AirportMetarStation[]> {
  type Row = AirportMetarStation & { dist: number; score: number };
  const rows: Row[] = [];

  for (const pad of [0.55, 1.1, 2.2, 4.5]) {
    const bbox = bboxAroundPoint(origin.lat, origin.long, pad);
    let features: GeoJsonFeature[];
    try {
      features = await fetchCollectionFeatures("swob-stations", bbox, axiosInstance, 200);
    } catch {
      continue;
    }

    for (const f of features) {
      const p = f.properties ?? {};
      const code = String(p.iata_id ?? "").trim().toUpperCase();
      const name = String(p.name ?? "").trim();
      const pt = pointFromGeometry(f);
      if (!isCanadianMetarIcao(code) || !pt || !name) continue;
      const dist = haversineKm(origin, pt);
      const bonus = heuristic === "interesting" ? metarInterestBonus(name) : 0;
      const score = dist - bonus;
      rows.push({ name, code, dist, score });
    }

    if (rows.length >= 3) break;
  }

  const byCode = new Map<string, Row>();
  for (const r of rows) {
    const prev = byCode.get(r.code);
    if (!prev || r.score < prev.score) byCode.set(r.code, r);
  }

  const deduped = [...byCode.values()];
  deduped.sort((a, b) => a.score - b.score);
  return deduped.slice(0, MAX_AIRPORT_METAR_STATIONS).map(({ name, code }) => ({ name, code }));
}

/**
 * Resolve MSC-backed feed suggestions for a citypage site using live HTTP (citypage + api.weather.gc.ca OGC).
 */
export async function resolveLocationFeedSuggestions(
  station: ECCCWeatherStation,
  flags: LocationFeedResolveFlags,
  axiosInstance: AxiosInstance = backendAxios
): Promise<LocationFeedSuggestions> {
  const base: LocationFeedSuggestions = {
    citypageLatLon: null,
    climate: null,
    ltce: null,
    aqhi: null,
    airportMetar: [],
  };

  const pt = await fetchCitypageLatLon(station.province, station.location, axiosInstance);
  if (!pt) return base;
  base.citypageLatLon = { lat: pt.lat, long: pt.long };

  const wantClimateLtce = !flags.hasCuratedAnchor && flags.dynamicClimateAndLtce;

  const [climate, ltce, aqhi, airportMetar] = await Promise.all([
    wantClimateLtce ? nearestClimateFromPoint(pt, axiosInstance) : Promise.resolve(null),
    wantClimateLtce ? nearestLtceFromPoint(pt, axiosInstance) : Promise.resolve(null),
    flags.aqhi ? nearestAqhiFromPoint(pt, axiosInstance) : Promise.resolve(null),
    flags.metar ? metarStationsFromPoint(pt, flags.metarHeuristic, axiosInstance) : Promise.resolve([] as AirportMetarStation[]),
  ]);

  base.climate = climate;
  base.ltce = ltce;
  base.aqhi = aqhi;
  base.airportMetar = airportMetar ?? [];
  return base;
}
