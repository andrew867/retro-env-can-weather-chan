import { CONDITIONS_WIND_SPEED_CALM } from "consts";
import { formatObservedLong } from "lib/date";
import { isLooseNull } from "lib/isnull";
import { useMemo } from "react";
import { AQHIObservationResponse, ObservedConditions, WeatherStationTimeData } from "types";

type ConditionsProp = {
  city: string;
  conditions: ObservedConditions;
  stationTime: WeatherStationTimeData;
  showPressure?: boolean;
  airQuality: AQHIObservationResponse;
  /** Forecast reload: show line `n` when `revealStep >= n` (see ForecastScreen). Omit to show all lines. */
  revealStep?: number;
};

export function Conditions(props: ConditionsProp) {
  const {
    city,
    conditions,
    stationTime,
    stationTime: { observedDateTime },
    showPressure = false,
    airQuality,
    revealStep = Number.MAX_SAFE_INTEGER,
  } = props ?? {};
  const {
    temperature: { value: temperatureValue, units: temperatureUnits },
    wind: {
      speed: { value: windSpeedValue },
      gust: windGust,
      direction: windDirection,
    },
    humidity: { value: humidityValue, units: humidityUnits },
    visibility: { value: visibilityValue, units: visibilityUnits },
    pressure: { value: pressureValue, units: pressureUnits, tendency: pressureTendency },
    windchill,
    abbreviatedCondition,
  } = conditions;

  const title = useMemo(
    () => stationTime && ` ${city.slice(0, 8).padEnd(11)}${formatObservedLong(stationTime, true)}`,
    [observedDateTime]
  );

  const formattedTemperature = useMemo(
    () =>
      (temperatureValue !== null && !isNaN(temperatureValue)
        ? `${Math.round(temperatureValue)} ${temperatureUnits ?? ""}`
        : "N/A"
      ).padStart(5),
    [observedDateTime]
  );

  const formattedWind = useMemo(() => {
    // handle "calm" or wind less than 2kmh
    if (!windSpeedValue || windSpeedValue === CONDITIONS_WIND_SPEED_CALM || Number(windSpeedValue) < 2)
      return CONDITIONS_WIND_SPEED_CALM;

    const speed = windSpeedValue ?? "";
    const direction = (windDirection ?? "").padStart(3);

    // gust is a different format (omits units)
    if (windGust) return `${direction}  ${speed}G${windGust.value} `;

    return `${direction}${`${speed} KMH`.padStart(8)}`;
  }, [observedDateTime]);

  const formattedHumidity = useMemo(() => `${humidityValue ?? "N/A"} ${humidityUnits}`.padStart(5), [stationTime]);

  const isShowingExtraData = windchill > 0 || airQuality?.value;
  const formattedVisibility = useMemo(() => {
    if (isLooseNull(visibilityValue)) return "";
    if (visibilityValue < 1) return `${(visibilityValue * 1000).toString().padStart(4, " ")} M`;

    return `${Math.round(visibilityValue)} ${visibilityUnits}`;
  }, [observedDateTime]);

  const rv = (step: number) => ({
    visibility: revealStep >= step ? ("visible" as const) : ("hidden" as const),
  });

  return (
    <div id="conditions">
      <div className="reload-animation" style={rv(1)}>
        {title}
      </div>
      <div>
        <span className="reload-animation" style={rv(2)}>
          <span>Temp&nbsp;</span>
          <span>{formattedTemperature}</span>
        </span>
        <span>{"".padEnd(6)}</span>
        <span className="reload-animation" style={rv(3)}>
          <span>Wind&nbsp;</span>
          <span>{formattedWind}</span>
        </span>
      </div>
      <div>
        <span className="reload-animation" style={rv(4)}>
          <span>Hum&nbsp;&nbsp;</span>
          <span>{formattedHumidity}</span>
        </span>
        <span>{"".padEnd(6)}</span>
        <span className="reload-animation" style={rv(5)}>
          <span>{abbreviatedCondition ?? ""}</span>
        </span>
      </div>
      <div>
        {isShowingExtraData && (
          <>
            <span className="reload-animation" style={rv(6)}>
              <span>Vsby&nbsp;</span>
              <span>{formattedVisibility.padStart(6)}</span>
            </span>
            <span>{"".padEnd(5)}</span>
            <span className="reload-animation" style={rv(7)}>
              {windchill > 0 && <span>Wind Chill {windchill}</span>}
              {!windchill && airQuality?.value && <span>Air Quality {airQuality.textValue}</span>}
            </span>
          </>
        )}
        {!isShowingExtraData && (
          <span className="reload-animation" style={rv(6)}>
            {"Visibility".padStart(16)}&nbsp;&nbsp;{formattedVisibility}
          </span>
        )}
      </div>
      {showPressure && (
        <div>
          {"Pressure".padStart(11)} {pressureValue.toFixed(1).padStart(5)} {pressureUnits.padEnd(4)} {pressureTendency}
        </div>
      )}
    </div>
  );
}
