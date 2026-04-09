export type FeedSource = "live" | "lkg" | "none";

export function feedSourceFromTimestamps(lastLiveIso: string | null, servedAsIso: string | null): FeedSource {
  if (!servedAsIso) return "none";
  if (lastLiveIso && servedAsIso === lastLiveIso) return "live";
  return "lkg";
}
