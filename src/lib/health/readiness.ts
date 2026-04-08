import { getMscAmqpStatsSnapshot } from "lib/amqp/mscAmqpStats";
import { citypageStaleFallbackAfterMs, shouldRunCitypageStaleHttpPoll } from "lib/eccc/citypageStaleFallback";
import { initializeCurrentConditions } from "lib/eccc/conditions";
import { SERVER_STARTED_AT_MS } from "lib/serverStartedAt";
import { getUpstreamCircuitSnapshot } from "lib/reliability/upstreamCircuit";

const conditions = initializeCurrentConditions();

export type HealthPayload = {
  ok: boolean;
  service: string;
  uptimeSec: number;
  mscAmqp: ReturnType<typeof getMscAmqpStatsSnapshot>;
  degraded: {
    citypageStale: boolean;
    upstreamCircuitCoolOff: boolean;
  };
};

export function getHealthPayload(): HealthPayload {
  const lastParse = conditions.getLastSuccessfulFetchIso();
  const staleAfterMs = citypageStaleFallbackAfterMs();
  const citypageStale = shouldRunCitypageStaleHttpPoll(lastParse, Date.now(), staleAfterMs);
  const circuits = getUpstreamCircuitSnapshot();
  const now = Date.now();
  const upstreamCircuitCoolOff = Object.values(circuits).some(
    (c) => c.coolOffUntilMs != null && c.coolOffUntilMs > now
  );

  return {
    ok: true,
    service: "rwc",
    uptimeSec: Math.floor((Date.now() - SERVER_STARTED_AT_MS) / 1000),
    mscAmqp: getMscAmqpStatsSnapshot(),
    degraded: {
      citypageStale,
      upstreamCircuitCoolOff,
    },
  };
}

/** Minimal bar for playout: citypage XML must have been parsed successfully within the stale window. */
export function getReadinessPayload(): { ready: boolean; reason: string | null } {
  const lastParse = conditions.getLastSuccessfulFetchIso();
  const stale = shouldRunCitypageStaleHttpPoll(lastParse, Date.now(), citypageStaleFallbackAfterMs());
  if (stale) {
    return { ready: false, reason: "citypage_data_stale" };
  }
  return { ready: true, reason: null };
}
