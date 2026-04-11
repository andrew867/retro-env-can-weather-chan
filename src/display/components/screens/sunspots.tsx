import { MAX_SUNSPOT_CITY_NAME_LENGTH } from "consts";
import { formatSunspotDate, isSunSpotSeason } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { format, isValid } from "date-fns";
import { useEffect, useMemo } from "react";
import {
  SolarCycleSwpcData,
  SolarFluxLatest,
  SunspotStationObservation,
  SunspotStationObservations,
  SunspotsWeatherPayload,
  WeatherStationTimeData,
  AutomaticScreenProps,
} from "types";

type SunspotScreenProps = {
  sunspotsPayload: SunspotsWeatherPayload | undefined;
  sunspotsFetchAttempted: boolean;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

function formatSwpcYmShort(timeTag: string): string {
  const [ys, ms] = timeTag.split("-");
  const y = Number(ys);
  const mo = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) return timeTag;
  return format(new Date(Date.UTC(y, mo - 1, 1)), "MMM yy").toUpperCase();
}

function formatSwpcDailyDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), "MMM d").toUpperCase();
}

/** NOAA SWPC plate lines; `null` if no slice loaded yet. */
function formatSwpcLines(swpc: SolarCycleSwpcData): string[] | null {
  /** ISN = international sunspot context; F10.7 = 10.7 cm radio flux index (same family as MSC flux plate). */
  const lines: string[] = ["NOAA SWPC CYCLE (ISN + F10.7)"];
  if (swpc.daily) {
    const ssn = Math.round(Number(swpc.daily.swpcSsn));
    if (Number.isFinite(ssn)) {
      const ds = formatSwpcDailyDate(swpc.daily.obsDateIso);
      const prefix = ds ? `${ds}  ` : "";
      lines.push(`${prefix}EST SSN ${String(ssn).padStart(3)}`);
    }
  }
  if (swpc.monthlyObserved) {
    const { ssn, observedSwpcSsn, f107, timeTag } = swpc.monthlyObserved;
    if ([ssn, observedSwpcSsn, f107].every((n) => Number.isFinite(Number(n)))) {
      const ym = formatSwpcYmShort(timeTag);
      lines.push(
        `${ym}  MO MEAN SSN ${String(Math.round(Number(ssn))).padStart(3)}  SWPC ${String(Math.round(Number(observedSwpcSsn))).padStart(3)}  F10 ${String(Math.round(Number(f107))).padStart(3)}`
      );
    }
  }
  if (swpc.monthlyPredicted) {
    const { predictedSsn: ps, predictedF107: pf, timeTag } = swpc.monthlyPredicted;
    if ([ps, pf].every((n) => Number.isFinite(Number(n)))) {
      const ym = formatSwpcYmShort(timeTag);
      lines.push(`${ym}  PRED SSN ${String(Math.round(Number(ps))).padStart(3)}  F10 ${String(Math.round(Number(pf))).padStart(3)}`);
    }
  }
  if (lines.length === 1) return null;
  return lines;
}

/** Safe against malformed upstream rows — bad flux must not take down the whole display bundle. */
function formatFluxLines(flux: SolarFluxLatest | null | undefined): string[] | null {
  if (!flux) return null;
  try {
    const fd = String(flux.fluxDate ?? "");
    const ft = String(flux.fluxTime ?? "00");
    if (!/^\d{8}$/.test(fd) || ft.length < 2) return null;
    const y = Number(fd.slice(0, 4));
    const mo = Number(fd.slice(4, 6)) - 1;
    const da = Number(fd.slice(6, 8));
    const dt = new Date(Date.UTC(y, mo, da));
    if (!isValid(dt)) return null;
    const dateStr = format(dt, "MMM d").toUpperCase();
    const hourZ = ft.slice(0, 2);
    const adj = Math.round(Number(flux.adjustedSfU));
    const obs = Math.round(Number(flux.observedSfU));
    const ursi = Math.round(Number(flux.ursiSfU));
    if (![adj, obs, ursi].every((n) => Number.isFinite(n))) return null;
    /** F10.7 = international index name for 2800 MHz flux; SFU = solar flux unit. */
    return [
      "F10.7 CM FLUX (SFU)  MSC/DRAO",
      `${dateStr} ${hourZ}Z  ADJ ${String(adj).padStart(3)}  OBS ${String(obs).padStart(3)}  URSI ${String(ursi).padStart(3)}`,
    ];
  } catch {
    return null;
  }
}

export function SunspotScreen(props: SunspotScreenProps) {
  const { sunspotsPayload, sunspotsFetchAttempted, weatherStationTime, onComplete } = props ?? {};
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const inSeason = isSunSpotSeason();

  const observations = useMemo((): SunspotStationObservations => {
    if (!sunspotsPayload) return [];
    return coerceArray<SunspotStationObservation>(sunspotsPayload.observations);
  }, [sunspotsPayload]);

  const solarFlux = sunspotsPayload?.solarFlux ?? null;
  const fluxLines = useMemo(() => formatFluxLines(solarFlux), [solarFlux]);
  const solarCycleSwpc = sunspotsPayload?.solarCycleSwpc;
  const swpcLines = useMemo(() => {
    try {
      return solarCycleSwpc ? formatSwpcLines(solarCycleSwpc) : null;
    } catch {
      return null;
    }
  }, [solarCycleSwpc]);
  const hasSwpcPlate = swpcLines != null;
  /** NWS warm-city grid outlook — server only polls during {@link isSunSpotSeason} (Feb–Mar). */
  const hasTropicalOutlook = inSeason && observations.length > 0;
  const hasAnyPlate = !!(fluxLines || hasSwpcPlate || hasTropicalOutlook);

  const sunspotDate = useMemo(
    () => weatherStationTime?.observedDateTime && formatSunspotDate(weatherStationTime).padEnd(9),
    [weatherStationTime?.observedDateTime]
  );

  useEffect(() => {
    if (!sunspotsFetchAttempted) return;
    /** Skip dwell when there is nothing to show; flux + SWPC are year-round (see `getSunspots`). */
    if (!hasAnyPlate) onCompleteRef.current();
  }, [sunspotsFetchAttempted, hasAnyPlate]);

  if (!hasAnyPlate) return <></>;

  const formatTemp = (temperature: number | null | undefined) =>
    Math.round(Number.isFinite(Number(temperature)) ? Number(temperature) : 0)
      .toString()
      .padStart(2, "0");

  return (
    <div id="sunspots_screen">
      {fluxLines ? (
        <div className="sunspots-flux-plate">
          {fluxLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      ) : null}
      {swpcLines ? (
        <div className="sunspots-flux-plate">
          {swpcLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      ) : null}
      {hasTropicalOutlook ? (
        <>
          <div className="sunspots-outlook-header">NWS TROPICAL SUNSPOT WX</div>
          <div>
            {sunspotDate}
            {"Sunspot Weather".padEnd(17)}
            Hi/Lo
          </div>
          <ol>
            {observations.map((sunspot, ix) => (
              <li key={sunspot.code ? String(sunspot.code) : `sunspot-${ix}`}>
                <span>
                  {(sunspot.name ?? "").slice(0, MAX_SUNSPOT_CITY_NAME_LENGTH).padEnd(MAX_SUNSPOT_CITY_NAME_LENGTH)}
                </span>
                <span>{(sunspot.abbreviatedForecast ?? sunspot.forecast ?? "").padEnd(13)}</span>
                <span>
                  {formatTemp(sunspot.highTemp)}/{formatTemp(sunspot.lowTemp)}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
