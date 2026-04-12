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

export type SunspotScreenPlate = "flux" | "swpc" | "tropical";

type SunspotScreenProps = {
  plate: SunspotScreenPlate;
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
  /** Two-line title keeps the NOAA header readable at recwc body size. */
  const lines: string[] = ["NOAA SWPC\nISN + F10.7"];
  if (swpc.daily) {
    const ssn = Math.round(Number(swpc.daily.swpcSsn));
    if (Number.isFinite(ssn)) {
      const ds = formatSwpcDailyDate(swpc.daily.obsDateIso);
      const prefix = ds ? `${ds} ` : "";
      lines.push(`${prefix}EST SSN ${String(ssn).padStart(3)}`);
    }
  }
  if (swpc.monthlyObserved) {
    const { ssn, observedSwpcSsn, f107, timeTag } = swpc.monthlyObserved;
    if ([ssn, observedSwpcSsn, f107].every((n) => Number.isFinite(Number(n)))) {
      const ym = formatSwpcYmShort(timeTag);
      lines.push(`${ym}  MO SSN ${String(Math.round(Number(ssn))).padStart(3)}`);
      lines.push(`SWPC ${String(Math.round(Number(observedSwpcSsn))).padStart(3)}`);
      lines.push(`F10.7 ${String(Math.round(Number(f107))).padStart(3)} SFU`);
    }
  }
  if (swpc.monthlyPredicted) {
    const { predictedSsn: ps, predictedF107: pf, timeTag } = swpc.monthlyPredicted;
    if ([ps, pf].every((n) => Number.isFinite(Number(n)))) {
      const ym = formatSwpcYmShort(timeTag);
      lines.push(`${ym}  PRED SSN ${String(Math.round(Number(ps))).padStart(3)}`);
      lines.push(`F10.7 ${String(Math.round(Number(pf))).padStart(3)} SFU`);
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
      "F10.7 CM FLUX (SFU)\nMSC/DRAO",
      `${dateStr}  ${hourZ}Z`,
      `ADJ ${String(adj).padStart(3)}  OBS ${String(obs).padStart(3)}`,
      `URSI ${String(ursi).padStart(3)}`,
    ];
  } catch {
    return null;
  }
}

export function SunspotScreen(props: SunspotScreenProps) {
  const { plate, sunspotsPayload, sunspotsFetchAttempted, weatherStationTime, onComplete } = props ?? {};
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

  const hasTropicalOutlook = inSeason && observations.length > 0;
  const hasPlateContent =
    plate === "flux"
      ? !!fluxLines
      : plate === "swpc"
        ? !!swpcLines
        : plate === "tropical" && hasTropicalOutlook;

  const sunspotDate = useMemo(
    () => (weatherStationTime?.observedDateTime ? formatSunspotDate(weatherStationTime) : ""),
    [weatherStationTime?.observedDateTime]
  );

  useEffect(() => {
    if (!sunspotsFetchAttempted) return;
    if (!hasPlateContent) onCompleteRef.current();
  }, [sunspotsFetchAttempted, hasPlateContent]);

  if (!hasPlateContent) return <></>;

  const formatTemp = (temperature: number | null | undefined) =>
    Math.round(Number.isFinite(Number(temperature)) ? Number(temperature) : 0)
      .toString()
      .padStart(2, "0");

  const renderPlateLines = (lines: string[], keyPrefix: string) =>
    lines.map((line, i) => (
      <div key={`${keyPrefix}-${i}`} className={i === 0 ? "sunspots-plate-title" : "sunspots-plate-line"}>
        {line}
      </div>
    ));

  return (
    <div id="sunspots_screen" className="sunspots-screen">
      {plate === "flux" && fluxLines ? (
        <section className="sunspots-plate sunspots-plate--flux" aria-label="MSC solar flux">
          {renderPlateLines(fluxLines, "flux")}
        </section>
      ) : null}
      {plate === "swpc" && swpcLines ? (
        <section className="sunspots-plate sunspots-plate--swpc" aria-label="NOAA SWPC ISN and F10.7">
          {renderPlateLines(swpcLines, "swpc")}
        </section>
      ) : null}
      {plate === "tropical" && hasTropicalOutlook ? (
        <section className="sunspots-plate sunspots-plate--outlook" aria-label="NWS tropical sunspot outlook">
          <div className="sunspots-plate-title sunspots-plate-title--outlook">NWS TROPICAL SUNSPOT WX</div>
          <div className="sunspots-outlook-meta">
            <span className="sunspots-outlook-date">{sunspotDate}</span>
            <span className="sunspots-outlook-sub">Warm-city outlook</span>
          </div>
          <div className="sunspots-outlook-grid" role="table" aria-label="City sunspot outlook">
            <div className="sunspots-outlook-row sunspots-outlook-row--head" role="row">
              <span role="columnheader">City</span>
              <span role="columnheader">Conditions</span>
              <span role="columnheader">Hi/Lo</span>
            </div>
            {observations.map((sunspot, ix) => (
              <div
                className="sunspots-outlook-row"
                role="row"
                key={sunspot.code ? String(sunspot.code) : `sunspot-${ix}`}
              >
                <span className="sunspots-outlook-city" role="cell" title={sunspot.name ?? ""}>
                  {(sunspot.name ?? "").slice(0, MAX_SUNSPOT_CITY_NAME_LENGTH)}
                </span>
                <span className="sunspots-outlook-forecast" role="cell" title={sunspot.forecast ?? ""}>
                  {sunspot.abbreviatedForecast ?? sunspot.forecast ?? ""}
                </span>
                <span className="sunspots-outlook-hilo" role="cell">
                  {formatTemp(sunspot.highTemp)}/{formatTemp(sunspot.lowTemp)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
