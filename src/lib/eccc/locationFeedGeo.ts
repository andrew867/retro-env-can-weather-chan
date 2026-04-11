import type { LatLong } from "types";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLong, b: LatLong): number {
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.long - a.long);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

export function bboxAroundPoint(lat: number, long: number, padDeg: number): [number, number, number, number] {
  const minLat = lat - padDeg;
  const maxLat = lat + padDeg;
  const minLong = long - padDeg;
  const maxLong = long + padDeg;
  return [minLong, minLat, maxLong, maxLat];
}
