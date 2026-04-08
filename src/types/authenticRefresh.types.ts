/** Optional serial-style reveal; default off (legacy line-by-line reload). @see retro_weather_authentic_refresh_spec.md */
export type AuthenticRefreshConfig = {
  enabled?: boolean;
  charsPerSecond?: number;
  jitterMsPerCharMax?: number;
  /**
   * When true (default), “forecast cont..” pages use the same grapheme-by-grapheme typing reveal as the first
   * forecast page; the rotator waits until the reveal finishes before advancing.
   */
  continuationGraphemeReveal?: boolean;
  respectReducedMotion?: boolean;
  streamUnit?: "grapheme" | "word";
};
