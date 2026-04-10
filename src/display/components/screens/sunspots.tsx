import { MAX_SUNSPOT_CITY_NAME_LENGTH } from "consts";
import { formatSunspotDate, isSunSpotSeason } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { format } from "date-fns";
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

function solarCycleSwpcHasContent(swpc: SolarCycleSwpcData | undefined): boolean {
  if (!swpc) return false;
  return !!(swpc.daily || swpc.monthlyObserved || swpc.monthlyPredicted);
}

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
  const lines: string[] = ["NOAA SWPC SOLAR CYCLE"];
  if (swpc.daily) {
    const ds = formatSwpcDailyDate(swpc.daily.obsDateIso);
    const prefix = ds ? `${ds}  ` : "";
    lines.push(`${prefix}EST SSN ${String(swpc.daily.swpcSsn).padStart(3)}`);
  }
  if (swpc.monthlyObserved) {
    const ym = formatSwpcYmShort(swpc.monthlyObserved.timeTag);
    const { ssn, observedSwpcSsn, f107 } = swpc.monthlyObserved;
    lines.push(
      `${ym}  MO MEAN SSN ${String(ssn).padStart(3)}  SWPC ${String(observedSwpcSsn).padStart(3)}  F10 ${String(f107).padStart(3)}`
    );
  }
  if (swpc.monthlyPredicted) {
    const ym = formatSwpcYmShort(swpc.monthlyPredicted.timeTag);
    lines.push(
      `${ym}  PRED SSN ${String(swpc.monthlyPredicted.predictedSsn).padStart(3)}  F10 ${String(swpc.monthlyPredicted.predictedF107).padStart(3)}`
    );
  }
  if (lines.length === 1) return null;
  return lines;
}

function formatFluxLines(flux: SolarFluxLatest): string[] {
  const y = Number(flux.fluxDate.slice(0, 4));
  const mo = Number(flux.fluxDate.slice(4, 6)) - 1;
  const da = Number(flux.fluxDate.slice(6, 8));
  const dateStr = format(new Date(Date.UTC(y, mo, da)), "MMM d").toUpperCase();
  const hourZ = flux.fluxTime.slice(0, 2);
  const adj = Math.round(flux.adjustedSfU);
  const obs = Math.round(flux.observedSfU);
  const ursi = Math.round(flux.ursiSfU);
  return [
    "10.7 CM SOLAR FLUX (MSC/DRAO)",
    `${dateStr} ${hourZ}Z  ADJ ${String(adj).padStart(3)}  OBS ${String(obs).padStart(3)}  URSI ${String(ursi).padStart(3)}`,
  ];
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
  const solarCycleSwpc = sunspotsPayload?.solarCycleSwpc;
  const swpcLines = useMemo(
    () => (solarCycleSwpc ? formatSwpcLines(solarCycleSwpc) : null),
    [solarCycleSwpc]
  );
  const hasSwpcPlate = swpcLines != null;

  useEffect(() => {
    if (!inSeason) {
      onCompleteRef.current();
      return;
    }
    if (!sunspotsFetchAttempted) return;
    if (!observations.length && !solarFlux && !solarCycleSwpcHasContent(solarCycleSwpc)) onCompleteRef.current();
  }, [inSeason, sunspotsFetchAttempted, observations.length, solarFlux, solarCycleSwpc]);

  if (!inSeason) return <></>;
  if (!observations.length && !solarFlux && !hasSwpcPlate) return <></>;

  const sunspotDate = useMemo(
    () => weatherStationTime?.observedDateTime && formatSunspotDate(weatherStationTime).padEnd(9),
    [weatherStationTime?.observedDateTime]
  );

  const formatTemp = (temperature: number | undefined) =>
    Math.round(Number.isFinite(Number(temperature)) ? Number(temperature) : 0)
      .toString()
      .padStart(2, "0");

  const fluxLines = solarFlux ? formatFluxLines(solarFlux) : null;

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
      {observations.length > 0 ? (
        <>
          <div>
            {sunspotDate}
            {"Sunspot Weather".padEnd(17)}
            Hi/Lo
          </div>
          <ol>
            {observations.map((sunspot) => (
              <li key={sunspot.code}>
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
