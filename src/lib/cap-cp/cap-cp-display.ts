import { CAPObject, CAPSeverity } from "types";

export function shouldAlertFlash(alert: CAPObject) {
  if (!alert) return false;

  // doing this because these seem to get sent over as at least moderate. but we also want some things that are moderate to flash
  if (["statement", "advisory"].some((warningType) => alert.headline?.toLowerCase().includes(warningType)))
    return false;

  return alert.severity >= CAPSeverity.MODERATE;
}

export function cleanupAlertHeadline(headline: string) {
  if (!headline?.length) return "";

  return headline.replace(/\sin effect/gi, "");
}

/**
 * Short banner for CAP continuation slides (full-screen alert text pages after the first).
 * Example: `YELLOW WARNING CONT.`
 */
export function compactContinuationBannerHeadline(headline: string) {
  const stripped = (headline ?? "")
    .replace(/\s*\(cont\.?\)\s*$/i, "")
    .trim();
  const cleaned = cleanupAlertHeadline(stripped);
  const m = cleaned.match(/^(red|yellow|green)\s+warning\b/i);
  if (m) return `${m[1].toUpperCase()} WARNING CONT.`;
  const words = cleaned.replace(/\s+/g, " ").trim();
  if (!words.length) return "WEATHER ALERT CONT.";
  const short = words.length > 48 ? `${words.slice(0, 45)}…` : words;
  return `${short} CONT.`;
}

export function isWarningSevereThunderstormWatch(headline: string) {
  return (headline ?? "").toLowerCase() === "severe thunderstorm watch in effect";
}
