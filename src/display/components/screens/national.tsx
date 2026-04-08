import {
  MAX_CONDITION_LENGTH,
  MAX_NATIONAL_STATION_NAME_LENGTH,
  MIN_NATIONAL_STATIONS_NEEDED_TO_DISPLAY,
} from "consts";
import { formatObservedLong } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo, useState } from "react";
import { NationalStationObservations, WeatherStationTimeData } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type NationalWeatherProps = {
  observations: NationalStationObservations;
  area: string; // unique identified since for when these screens are in a row and the component doesn't unrender
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

export function NationalWeatherScreen(props: NationalWeatherProps) {
  const { observations: observationsRaw, area, weatherStationTime, onComplete } = props ?? {};
  const observations = coerceArray(observationsRaw);
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const title = useMemo(
    () => formatObservedLong(weatherStationTime, true, " "),
    [weatherStationTime?.observedDateTime]
  );

  const [observationsOnMount, setObservationsOnMount] = useState<NationalStationObservations>();
  const [areaOnMount, setAreaOnMount] = useState("");

  // this stops the observations changing whilst the screen is being displayed
  useEffect(() => {
    if (
      !observations ||
      observations.length < MIN_NATIONAL_STATIONS_NEEDED_TO_DISPLAY ||
      !weatherStationTime?.observedDateTime
    ) {
      onCompleteRef.current();
      return;
    }

    if (area !== areaOnMount || !observationsOnMount?.length) setObservationsOnMount(observations);
    setAreaOnMount(area);
  }, [observations, area, weatherStationTime?.observedDateTime]);

  if (!observationsOnMount || !weatherStationTime?.observedDateTime) return <></>;

  return (
    <div id="national_weather">
      <>
        {"".padStart(6)}
        {title}
      </>
      <ol>
        {observationsOnMount.map((nationalObservation) => (
          <li key={nationalObservation.code}>
            <span>{(nationalObservation.name ?? "").padEnd(MAX_NATIONAL_STATION_NAME_LENGTH)}</span>
            <span>{Math.round(Number(nationalObservation.temperature ?? 0)).toString().padStart(4)}</span>
            <span>
              {"".padStart(2)}
              {(nationalObservation.abbreviatedCondition ?? "").padEnd(MAX_CONDITION_LENGTH)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
