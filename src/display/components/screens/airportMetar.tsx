import {
  MAX_CONDITION_LENGTH,
  MAX_NATIONAL_STATION_NAME_LENGTH,
  MIN_AIRPORT_METAR_STATIONS_TO_DISPLAY,
} from "consts";
import { formatObservedLong } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo, useState } from "react";
import { NationalStationObservations, WeatherStationTimeData } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type AirportMetarScreenProps = {
  observations: NationalStationObservations;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

/** ICAO METAR list (AWC); same row layout as national/USA regional screens. */
export function AirportMetarScreen(props: AirportMetarScreenProps) {
  const { observations: observationsRaw, weatherStationTime, onComplete } = props ?? {};
  const observations = coerceArray(observationsRaw);
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
            .slice(0, MAX_NATIONAL_STATION_NAME_LENGTH)
            .padEnd(MAX_NATIONAL_STATION_NAME_LENGTH);
          const t = row.temperature;
          const temp =
            t !== null && t !== undefined && Number.isFinite(Number(t))
              ? Math.round(Number(t)).toString().padStart(4)
              : "  --".padStart(4);
          const cond = (row.abbreviatedCondition ?? "")
            .slice(0, MAX_CONDITION_LENGTH)
            .padEnd(MAX_CONDITION_LENGTH);
          return (
            <li key={row.code != null && String(row.code).length ? String(row.code) : `metar-${ix}`}>
              <span>{`${name}${temp} ${cond}`}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
