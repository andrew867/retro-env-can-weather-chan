export const MAX_CONDITION_LENGTH = 13;
export const MAX_US_FORECAST_CONDITION_LENGTH = 12;
/** @deprecated Legacy poll cadence; `GET /api/v1/weather/live` is now push + heartbeat. */
export const CONDITIONS_EVENT_STREAM_INTERVAL = 5 * 1000;
export const CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT = "condition_update";
/** Same citypage parse as conditions; sent alongside `condition_update` when MSC XML updates (AMQP / HTTP). */
export const CONDITIONS_EVENT_STREAM_FORECAST_UPDATE_EVENT = "forecast_update";
/** SSE comment ping interval for `/weather/live` (proxies). */
export const SSE_WEATHER_HEARTBEAT_MS = 30 * 1000;
/** `GET /api/v1/weather/alerts/stream` — CAP list changed (NAADS-style AMQP on MSC public broker). */
export const ALERTS_SSE_UPDATE_EVENT = "alerts_update";
export const CONDITIONS_WIND_SPEED_CALM = "calm";

/** `GET /api/v1/init/stream` — EventSource event when crawler lines change (RDS / config POST). */
export const INIT_SSE_CRAWLER_EVENT = "crawler_update";
