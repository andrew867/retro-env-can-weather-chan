import { MAX_SUNSPOT_CITY_NAME_LENGTH } from "consts";
import { formatSunspotDate, isSunSpotSeason } from "lib/date";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo } from "react";
import { SunspotStationObservations, WeatherStationTimeData, AutomaticScreenProps } from "types";

type SunspotScreenProps = {
  sunspots: SunspotStationObservations | undefined;
  sunspotsFetchAttempted: boolean;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

export function SunspotScreen(props: SunspotScreenProps) {
  const { sunspots: sunspotsRaw, sunspotsFetchAttempted, weatherStationTime, onComplete } = props ?? {};
  const sunspots = coerceArray(sunspotsRaw);
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const inSeason = isSunSpotSeason();

  useEffect(() => {
    if (!inSeason) {
      onCompleteRef.current();
      return;
    }
    if (!sunspotsFetchAttempted) return;
    if (!sunspots.length) onCompleteRef.current();
  }, [inSeason, sunspotsFetchAttempted, sunspots]);

  if (!inSeason || !sunspots.length) return <></>;

  const sunspotDate = useMemo(
    () => weatherStationTime?.observedDateTime && formatSunspotDate(weatherStationTime).padEnd(9),
    [weatherStationTime?.observedDateTime]
  );

  const formatTemp = (temperature: number | undefined) =>
    Math.round(Number.isFinite(Number(temperature)) ? Number(temperature) : 0)
      .toString()
      .padStart(2, "0");

  return (
    <div id="sunspots_screen">
      <div>
        {sunspotDate}
        {"Sunspot Weather".padEnd(17)}
        Hi/Lo
      </div>
      <ol>
        {sunspots.map((sunspot) => (
          <li key={sunspot.code}>
            <span>{(sunspot.name ?? "").slice(0, MAX_SUNSPOT_CITY_NAME_LENGTH).padEnd(MAX_SUNSPOT_CITY_NAME_LENGTH)}</span>
            <span>{(sunspot.abbreviatedForecast ?? sunspot.forecast ?? "").padEnd(13)}</span>
            <span>
              {formatTemp(sunspot.highTemp)}/{formatTemp(sunspot.lowTemp)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
