import {
  AIRPORT_METAR_FLT_CAT_FIELD_WIDTH,
  AIRPORT_METAR_NAME_FIELD_WIDTH,
  AIRPORT_METAR_REST_CONDITION_MAX,
  MIN_AIRPORT_METAR_STATIONS_TO_DISPLAY,
} from "consts";
import { formatObservedLong } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo, useState } from "react";
import { NationalStationObservation, NationalStationObservations, WeatherStationTimeData } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type AirportMetarScreenProps = {
  observations: NationalStationObservations;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

/** ICAO METAR list (AWC); same row layout as national/USA regional screens. */
export function AirportMetarScreen(props: AirportMetarScreenProps) {
  const { observations: observationsRaw, weatherStationTime, onComplete } = props ?? {};
  const observations = coerceArray<NationalStationObservation>(observationsRaw);
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const title = useMemo(
    () => formatObservedLong(weatherStationTime, true, " "),
    [weatherStationTime?.observedDateTime]
  );

  const [observationsOnMount, setObservationsOnMount] = useState<NationalStationObservations>();
  const [areaOnMount, setAreaOnMount] = useState("");

  useEffect(() => {
    if (
      !observations ||
      observations.length < MIN_AIRPORT_METAR_STATIONS_TO_DISPLAY ||
      !weatherStationTime?.observedDateTime
    ) {
      onCompleteRef.current();
      return;
    }

    const area = "METAR";
    if (area !== areaOnMount || !observationsOnMount?.length) setObservationsOnMount(observations);
    setAreaOnMount(area);
  }, [observations, areaOnMount, observationsOnMount?.length, weatherStationTime?.observedDateTime]);

  if (!observationsOnMount || !weatherStationTime?.observedDateTime) return <></>;

  return (
    <div id="airport_metar">
      <>
        {"".padStart(6)}
        {title}
      </>
      <ol>
        {observationsOnMount.map((row, ix) => {
          const name = (row.name ?? "")
            .slice(0, AIRPORT_METAR_NAME_FIELD_WIDTH)
            .padEnd(AIRPORT_METAR_NAME_FIELD_WIDTH);
          const t = row.temperature;
          const temp =
            t !== null && t !== undefined && Number.isFinite(Number(t))
              ? Math.round(Number(t)).toString().padStart(4)
              : "  --".padStart(4);
          const flt = (row.metarFltCatPadded ?? "")
            .slice(0, AIRPORT_METAR_FLT_CAT_FIELD_WIDTH)
            .padEnd(AIRPORT_METAR_FLT_CAT_FIELD_WIDTH, " ");
          const cond = (row.abbreviatedCondition ?? "")
            .slice(0, AIRPORT_METAR_REST_CONDITION_MAX)
            .padEnd(AIRPORT_METAR_REST_CONDITION_MAX);
          return (
            <li key={row.code != null && String(row.code).length ? String(row.code) : `metar-${ix}`}>
              <span>{name}</span>
              <span>{temp}</span>
              <span> </span>
              <span>{flt}</span>
              <span> · </span>
              <span>{cond}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
