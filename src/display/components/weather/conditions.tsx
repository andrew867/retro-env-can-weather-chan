import { CONDITIONS_WIND_SPEED_CALM } from "consts";
import { formatObservedLong } from "lib/date";
import { isLooseNull } from "lib/isnull";
import { useMemo } from "react";
import { AQHIObservationResponse, ObservedConditions, WeatherStationTimeData } from "types";

/** ECCC `{ value, units }` blobs — read `.value` only after confirming the parent object exists (avoids `undefined.value`). */
function unitValue(container: unknown): unknown {
  if (container == null || typeof container !== "object") return undefined;
  return (container as { value?: unknown }).value;
}

type ConditionsProp = {
  city?: string | null;
  /** May be absent for a render while hooks merge SSE + polled payloads. */
  conditions?: ObservedConditions | null;
  /** May be missing briefly while observed payload is merged (avoid crashing on destructure). */
  stationTime?: WeatherStationTimeData;
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
    showPressure = false,
    airQuality,
    revealStep = Number.MAX_SAFE_INTEGER,
  } = props ?? {};
  const observedDateTime = stationTime?.observedDateTime;

  if (conditions == null) {
    return <div id="conditions" />;
  }

  // Avoid `a.b.value` when `b` may be undefined (merge / partial XML) — use unitValue + explicit wind branches.
  const temperatureValue = unitValue(conditions.temperature);
  const temperatureUnits =
    conditions.temperature != null && typeof conditions.temperature === "object"
      ? (conditions.temperature as { units?: string }).units
      : undefined;

  const windRoot = conditions.wind != null && typeof conditions.wind === "object" ? conditions.wind : null;
  const windSpeedValue = windRoot != null ? unitValue((windRoot as { speed?: unknown }).speed) : undefined;
  const windGust = windRoot != null ? (windRoot as { gust?: unknown }).gust : undefined;
  const windDirection = windRoot != null ? (windRoot as { direction?: string }).direction : undefined;

  const humidityValue = unitValue(conditions.humidity);
  const humidityUnits =
    conditions.humidity != null && typeof conditions.humidity === "object"
      ? (conditions.humidity as { units?: string }).units ?? ""
      : "";

  const visibilityValue = unitValue(conditions.visibility);
  const visibilityUnits =
    conditions.visibility != null && typeof conditions.visibility === "object"
      ? (conditions.visibility as { units?: string }).units ?? ""
      : "";

  const pressureValue = unitValue(conditions.pressure);
  const pressureUnits =
    conditions.pressure != null && typeof conditions.pressure === "object"
      ? (conditions.pressure as { units?: string }).units ?? ""
      : "";
  const pressureTendency =
    conditions.pressure != null && typeof conditions.pressure === "object"
      ? (conditions.pressure as { tendency?: string }).tendency ?? ""
      : "";
  const windchill = conditions.windchill;
  const abbreviatedCondition = conditions.abbreviatedCondition;

  const title = useMemo(
    () => stationTime && ` ${(city ?? "").slice(0, 8).padEnd(11)}${formatObservedLong(stationTime, true)}`,
    [city, observedDateTime, stationTime]
  );

  const formattedTemperature = useMemo(() => {
    const tv =
      typeof temperatureValue === "number"
        ? temperatureValue
        : typeof temperatureValue === "string" && temperatureValue !== ""
          ? Number(temperatureValue)
          : NaN;
    return (
      (tv !== null && !Number.isNaN(tv) ? `${Math.round(tv)} ${temperatureUnits ?? ""}` : "N/A").padStart(5)
    );
  }, [observedDateTime, temperatureValue, temperatureUnits]);

  const formattedWind = useMemo(() => {
    // handle "calm" or wind less than 2kmh
    if (!windSpeedValue || windSpeedValue === CONDITIONS_WIND_SPEED_CALM || Number(windSpeedValue) < 2)
      return CONDITIONS_WIND_SPEED_CALM;

    const speed = windSpeedValue ?? "";
    const direction = (windDirection ?? "").padStart(3);

    // gust is a different format (omits units)
    const gustVal = unitValue(windGust);
    if (gustVal != null && String(gustVal).length > 0) {
      return `${direction}  ${speed}G${String(gustVal)} `;
    }

    return `${direction}${`${speed} KMH`.padStart(8)}`;
  }, [observedDateTime, windDirection, windGust, windSpeedValue]);

  const formattedHumidity = useMemo(
    () => `${humidityValue ?? "N/A"} ${humidityUnits}`.padStart(5),
    [humidityValue, humidityUnits, stationTime]
  );

  const isShowingExtraData = windchill > 0 || airQuality?.value;
  const formattedVisibility = useMemo(() => {
    if (isLooseNull(visibilityValue)) return "";
    const visNum =
      typeof visibilityValue === "number"
        ? visibilityValue
        : typeof visibilityValue === "string" && visibilityValue !== ""
          ? Number(visibilityValue)
          : NaN;
    if (!Number.isFinite(visNum)) return "";
    if (visNum < 1) return `${(visNum * 1000).toString().padStart(4, " ")} M`;

    return `${Math.round(visNum)} ${visibilityUnits}`;
  }, [observedDateTime, visibilityValue, visibilityUnits]);

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
        <span>{"".padEnd(3)}</span>
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
        <span>{"".padEnd(3)}</span>
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
            <span>{"".padEnd(2)}</span>
            <span className="reload-animation" style={rv(7)}>
              {windchill > 0 && <span>Wind Chill {windchill}</span>}
              {!windchill && airQuality?.value != null && (
                <span>Air Quality {airQuality?.textValue ?? ""}</span>
              )}
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
          {"Pressure".padStart(11)}{" "}
          {pressureValue != null && Number.isFinite(Number(pressureValue))
            ? Number(pressureValue).toFixed(1).padStart(5)
            : "  N/A"}{" "}
          {pressureUnits.padEnd(4)} {pressureTendency}
        </div>
      )}
    </div>
  );
}
