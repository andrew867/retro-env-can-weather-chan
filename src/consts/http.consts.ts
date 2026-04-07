/** Outbound HTTP from Node (ECCC, datamart, CAP, etc.). */
export const BACKEND_HTTP_TIMEOUT_MS = 45_000;

/** Browser → local `/api/v1` (same host, should fail fast if server is wedged). */
export const DISPLAY_HTTP_TIMEOUT_MS = 25_000;

/** How often the display posts in-browser axios counters to `POST /api/v1/metrics/client`. */
export const CLIENT_METRICS_POST_INTERVAL_MS = 30_000;

export const HTTP_MAX_REDIRECTS = 5;

/** Optional cache / staleness hint for API consumers (ISO 8601). */
export const RWC_DATA_FETCHED_AT_HEADER = "X-RWC-Data-Fetched-At";
