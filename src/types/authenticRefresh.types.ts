/** Clear phase before streaming new observation text (forecast first page). */
export type AuthenticClearStyle = "blank" | "fill" | "inverse";

/** Optional serial-style reveal; default off (legacy line-by-line reload). @see retro_weather_authentic_refresh_spec.md */
export type AuthenticRefreshConfig = {
  enabled?: boolean;
  charsPerSecond?: number;
  clearHoldMs?: number;
  clearStyle?: AuthenticClearStyle;
  jitterMsPerCharMax?: number;
  secondaryPageStreaming?: boolean;
  respectReducedMotion?: boolean;
  streamUnit?: "grapheme" | "word";
};
