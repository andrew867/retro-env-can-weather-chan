export const DISPLAY_MAX_CHARACTERS_PER_LINE = 32;
export const DISPLAY_MAX_LINES = 8;

/**
 * Weather station stats (`#stats_screen`): one column narrower than `DISPLAY_MAX_CHARACTERS_PER_LINE` (32)
 * so full-width monospace lines stay inside `#display` horizontal padding at recwc body size (avoids
 * symmetric edge clipping when `#rwc-screen-body` centers a slightly too-wide block).
 */
export const STATS_SCREEN_MAX_CHARACTERS_PER_LINE = 31;
