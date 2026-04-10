import { SERVER_STARTED_AT_MS } from "lib/serverStartedAt";
import { initializeCurrentConditions, initializeHistoricalTempPrecip, initializeClimateNormals } from "lib/eccc";
import { initializeAlertMonitor } from "lib/eccc/alertMonitor";
import { initializeAirQuality } from "lib/eccc/airQuality";
import { initializeCanadaProvincialHotColdSpot } from "lib/eccc/canadaHotColdSpot";
import { initializeNationalWeather } from "lib/national";
import { initializeProvinceTracking } from "lib/provincetracking";
import { initializeUSAWeather } from "lib/usaweather";
import { initializeAirportMetarWeather } from "lib/airportMetar";
import { initializeSunspots } from "lib/sunspots";
import { feedSourceFromTimestamps, type FeedSource } from "lib/status/feedSource";
import { getMscAmqpStatsSnapshot } from "lib/amqp/mscAmqpStats";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: packageVersion } = require("../../../package.json") as { version: string };

export const STATUS_SCHEMA_VERSION = 2;

export type StatusRefreshTarget =
  | "observed"
  | "national"
  | "usa"
  | "airport_metar"
  | "province"
  | "sunspots"
  | "hot_cold"
  | "alerts"
  | "historical"
  | "climate_normals"
  | "aqhi";

export const STATUS_REFRESH_TARGETS: readonly StatusRefreshTarget[] = [
  "observed",
  "national",
  "usa",
  "airport_metar",
  "province",
  "sunspots",
  "hot_cold",
  "alerts",
  "historical",
  "climate_normals",
  "aqhi",
] as const;

export type StatusFeedBlock = {
  dataFetchedAt: string | null;
  /** ISO time the server would use for `X-RWC-Data-Fetched-At` style headers when applicable. */
  servedDataAsOf: string | null;
  source: FeedSource;
  note?: string;
  observationId?: string | null;
  count?: number;
  /** MSC AMQP `*.WXO-DD.alerts.cap.#` notifications received this process (includes non-station-relevant CAP). */
  capAmqpReceived?: number;
  /** ISO time of last AMQP CAP notification (push), not necessarily ingested as an active alert. */
  capAmqpLastRxAt?: string | null;
};

export type StatusSnapshot = {
  statusSchemaVersion: typeof STATUS_SCHEMA_VERSION;
  server: {
    uptimeSec: number;
    packageVersion: string;
    nodeEnv: string;
  };
  feeds: Record<string, StatusFeedBlock>;
};

function citypageBlock(): StatusFeedBlock {
  const conditions = initializeCurrentConditions();
  const obs = conditions.observed();
  const fetchedAt = obs.fetchedAt ?? null;
  return {
    dataFetchedAt: fetchedAt,
    servedDataAsOf: fetchedAt,
    source: fetchedAt ? "live" : "none",
    observationId: obs.observationID || null,
  };
}

export function buildStatusSnapshot(): StatusSnapshot {
  const national = initializeNationalWeather();
  const usa = initializeUSAWeather();
  const airport = initializeAirportMetarWeather();
  const province = initializeProvinceTracking();
  const sunspots = initializeSunspots();
  const hotCold = initializeCanadaProvincialHotColdSpot();
  const alerts = initializeAlertMonitor();
  const historical = initializeHistoricalTempPrecip();
  const climate = initializeClimateNormals();
  const aqhi = initializeAirQuality();

  const nationalLive = national.getLastSuccessfulFetchIso();
  const nationalServed = national.getDataFetchedAtForHeader();
  const usaLive = usa.getLastSuccessfulFetchIso();
  const usaServed = usa.getDataFetchedAtForHeader();
  const airportLive = airport.getLastSuccessfulFetchIso();
  const airportServed = airport.getDataFetchedAtForHeader();
  const provinceLive = province.getLastFetchIso();
  const provinceServed = province.getDataFetchedAtForHeader();
  const sunspotsAt = sunspots.getLastFetchIso();

  const alertList = alerts.alerts().alerts ?? [];
  const capAmqp = getMscAmqpStatsSnapshot().alerts;

  return {
    statusSchemaVersion: STATUS_SCHEMA_VERSION,
    server: {
      uptimeSec: Math.floor((Date.now() - SERVER_STARTED_AT_MS) / 1000),
      packageVersion,
      nodeEnv: process.env.NODE_ENV ?? "undefined",
    },
    feeds: {
      citypage: citypageBlock(),
      national: {
        dataFetchedAt: nationalLive,
        servedDataAsOf: nationalServed,
        source: feedSourceFromTimestamps(nationalLive, nationalServed),
      },
      usa: {
        dataFetchedAt: usaLive,
        servedDataAsOf: usaServed,
        source: feedSourceFromTimestamps(usaLive, usaServed),
      },
      airport_metar: {
        dataFetchedAt: airportLive,
        servedDataAsOf: airportServed,
        source: feedSourceFromTimestamps(airportLive, airportServed),
      },
      province: {
        dataFetchedAt: provinceLive,
        servedDataAsOf: provinceServed,
        source: feedSourceFromTimestamps(provinceLive, provinceServed),
      },
      sunspots: {
        dataFetchedAt: sunspotsAt,
        servedDataAsOf: sunspotsAt,
        source: sunspotsAt ? "live" : "none",
        ...(!sunspotsAt ? { note: "No data yet, or outside sunspot season (operator refresh is a no-op then)." } : {}),
      },
      hot_cold: {
        dataFetchedAt: hotCold.getLastFetchIso(),
        servedDataAsOf: hotCold.getLastFetchIso(),
        source: hotCold.getLastFetchIso() ? "live" : "none",
      },
      alerts: {
        dataFetchedAt: alerts.getLastDataAsOf(),
        servedDataAsOf: alerts.getLastDataAsOf(),
        source: alerts.getLastDataAsOf() ? "live" : "none",
        count: alertList.length,
        capAmqpReceived: capAmqp.messageCount,
        capAmqpLastRxAt: capAmqp.lastMessageAt,
        note: "New CAP files arrive via AMQP; refresh runs expiry trim only.",
      },
      historical: {
        dataFetchedAt: historical.getLastBulkFetchCompletedIso(),
        servedDataAsOf: historical.getLastBulkFetchCompletedIso(),
        source: historical.getLastBulkFetchCompletedIso() ? "live" : "none",
      },
      climate_normals: {
        dataFetchedAt: climate.getLastFetchIso(),
        servedDataAsOf: climate.getLastFetchIso(),
        source: climate.getLastFetchIso() ? "live" : "none",
      },
      aqhi: {
        dataFetchedAt: aqhi.getLastFetchIso(),
        servedDataAsOf: aqhi.getLastFetchIso(),
        source: aqhi.getLastFetchIso() ? "live" : "none",
        note: aqhi.observation ? undefined : "No station configured or observation empty.",
      },
    },
  };
}

export function isStatusRefreshTarget(s: string): s is StatusRefreshTarget {
  return (STATUS_REFRESH_TARGETS as readonly string[]).includes(s);
}

export function triggerStatusRefresh(target: StatusRefreshTarget): void {
  const conditions = initializeCurrentConditions();
  const historical = initializeHistoricalTempPrecip();
  const climate = initializeClimateNormals();

  switch (target) {
    case "observed":
      conditions.requestCitypageRefresh();
      return;
    case "national":
      initializeNationalWeather().requestOperatorRefresh();
      return;
    case "usa":
      initializeUSAWeather().requestOperatorRefresh();
      return;
    case "airport_metar":
      initializeAirportMetarWeather().requestOperatorRefresh();
      return;
    case "province":
      initializeProvinceTracking().requestOperatorRefresh();
      return;
    case "sunspots":
      initializeSunspots().requestOperatorRefresh();
      return;
    case "hot_cold":
      initializeCanadaProvincialHotColdSpot().requestOperatorRefresh();
      return;
    case "alerts":
      initializeAlertMonitor().requestOperatorMaintenance();
      return;
    case "historical":
      historical.fetchLastTwoYearsOfData(conditions.observedDateTimeAtStation());
      return;
    case "climate_normals":
      climate.requestOperatorRefresh(conditions.observedDateTimeAtStation());
      return;
    case "aqhi":
      initializeAirQuality().requestOperatorRefresh();
      return;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}

export function triggerStatusRefreshAll(): void {
  for (const t of STATUS_REFRESH_TARGETS) {
    triggerStatusRefresh(t);
  }
}
