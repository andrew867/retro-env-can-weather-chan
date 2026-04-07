import type { AuthenticClearStyle, AuthenticRefreshConfig } from "types";

/** Split text into grapheme clusters when supported; else code-point iteration. */
export function segmentGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(text), (s) => s.segment);
    } catch {
      /* fall through */
    }
  }
  return Array.from(text);
}

export function uniformJitterMs(maxInclusive: number): number {
  if (maxInclusive <= 0) return 0;
  return Math.floor(Math.random() * (maxInclusive + 1));
}

/** Base interval between grapheme reveals (ms), before jitter. */
export function baseMsPerGrapheme(charsPerSecond: number): number {
  const cps = Math.min(120, Math.max(1, charsPerSecond));
  return Math.round(1000 / cps);
}

/** One step delay: base + jitter (spec §6). */
export function computeStepDelayMs(config: Pick<AuthenticRefreshConfig, "charsPerSecond" | "jitterMsPerCharMax">): number {
  const cps = config.charsPerSecond ?? 10;
  const jitter = config.jitterMsPerCharMax ?? 0;
  return baseMsPerGrapheme(cps) + uniformJitterMs(jitter);
}

export function isStreamablePlaintext(s: string): boolean {
  return s.trim().length > 0;
}

export function clearStyleClass(style: AuthenticClearStyle | undefined): string {
  const s = style ?? "blank";
  if (s === "fill") return "authentic-clear--fill";
  if (s === "inverse") return "authentic-clear--inverse";
  return "authentic-clear--blank";
}
