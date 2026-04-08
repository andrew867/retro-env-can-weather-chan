export const EVENT_BUS_CONFIG_CHANGE_SUFFIX = "config:";
export const EVENT_BUS_CONFIG_CHANGE_PRIMARY_LOCATION = EVENT_BUS_CONFIG_CHANGE_SUFFIX + "primary_location";
export const EVENT_BUS_CONFIG_CHANGE_AIR_QUALITY_STATION = EVENT_BUS_CONFIG_CHANGE_SUFFIX + "air_quality";
export const EVENT_BUS_CONFIG_CHANGE_CLIMATE_NORMALS = EVENT_BUS_CONFIG_CHANGE_SUFFIX + "climate_normals";
export const EVENT_BUS_CONFIG_CHANGE_HISTORICAL_TEMP_PRECIP = EVENT_BUS_CONFIG_CHANGE_SUFFIX + "historical_temp_precip";
export const EVENT_BUS_CONFIG_CHANGE_PROVINCE_TRACKING = EVENT_BUS_CONFIG_CHANGE_SUFFIX + "province_tracking";

export const EVENT_BUS_MAIN_STATION_UPDATE_SUFFIX = "condition_update:";
export const EVENT_BUS_MAIN_STATION_UPDATE_NEW_CONDITIONS = EVENT_BUS_MAIN_STATION_UPDATE_SUFFIX + "new_conditions";

/**
 * Historical bulk XML and/or climate normals CSV finished applying — same observation may now include
 * last-year almanac temps, season normals, yesterday precip; push an SSE snapshot refresh.
 */
export const EVENT_BUS_AUXILIARY_WEATHER_DATA_READY = "conditions:auxiliary_data_ready";

/** CAP ingest (AMQP `*.WXO-DD.alerts.cap.#`) updated relevant alerts list — drives `GET /api/v1/weather/alerts/stream`. */
export const EVENT_BUS_ALERTS_UPDATED = "alerts:updated";
