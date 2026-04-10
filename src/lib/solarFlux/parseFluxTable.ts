import type { SolarFluxLatest } from "types";

const ROW_RE = /^(\d{8})\s+(\d{6})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/;

function parseFluxToken(raw: string): number | null {
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse MSC/DRAO `fluxtable.txt` body. Each non-comment line is whitespace-separated columns:
 * fluxdate, fluxtime, julian, carrington, observed, adjusted, ursi (SFU).
 */
export function parseFluxTable(text: string): SolarFluxLatest[] {
  const out: SolarFluxLatest[] = [];
  if (!text || typeof text !== "string") return out;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.includes("---")) continue;
    if (/^fluxdate\b/i.test(trimmed)) continue;

    const m = trimmed.match(ROW_RE);
    if (!m) continue;

    const [, fluxDate, fluxTime, , , obsRaw, adjRaw, ursiRaw] = m;
    const observedSfU = parseFluxToken(obsRaw);
    const adjustedSfU = parseFluxToken(adjRaw);
    const ursiSfU = parseFluxToken(ursiRaw);
    if (observedSfU == null || adjustedSfU == null || ursiSfU == null) continue;

    out.push({
      fluxDate,
      fluxTime,
      observedSfU,
      adjustedSfU,
      ursiSfU,
    });
  }

  return out;
}

/** Last row in the file is the most recent measurement. */
export function latestFluxFromTableText(text: string): SolarFluxLatest | null {
  const rows = parseFluxTable(text);
  return rows.length ? rows[rows.length - 1]! : null;
}
