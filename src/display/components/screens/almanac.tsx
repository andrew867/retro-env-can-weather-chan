import { AQHIObservationResponse, WeatherStation } from "types";
import { Conditions } from "../weather";

type AlmanacScreenProps = {
  weatherStationResponse: WeatherStation;
  airQuality: AQHIObservationResponse | null;
};

const TEMPERATURE_STRING_LENGTH = 5;

export function AlmanacScreen(props: AlmanacScreenProps) {
  const { weatherStationResponse, airQuality } = props ?? {};

  // no response from weather station so whatever
  if (!weatherStationResponse) return <></>;

  const city = weatherStationResponse.city ?? "";
  const observed = weatherStationResponse.observed ?? undefined;
  const stationTime = weatherStationResponse.stationTime;
  const almanac = weatherStationResponse.almanac;

  const formatTemperature = (temperature: number | null | undefined, length: number = TEMPERATURE_STRING_LENGTH) => {
    if (temperature == null || Number.isNaN(Number(temperature))) return "N/A".padStart(length);
    return Number(temperature).toFixed(1).padStart(length);
  };

  const lastYear = {
    hi: formatTemperature(almanac?.temperatures?.lastYearMax?.value),
    lo: formatTemperature(almanac?.temperatures?.lastYearMin?.value),
  };

  const normal = {
    hi: formatTemperature(almanac?.temperatures?.normalMax?.value, 6),
    lo: formatTemperature(almanac?.temperatures?.normalMin?.value, 6),
  };

  const recordHiVal = formatTemperature(almanac?.temperatures?.extremeMax?.value, 6);
  const recordHiYr = almanac?.temperatures?.extremeMax?.year;
  const recordLoVal = formatTemperature(almanac?.temperatures?.extremeMin?.value, 6);
  const recordLoYr = almanac?.temperatures?.extremeMin?.year;

  // the extra spaces in the table below are intentional. Last year is meant to have a space before it.
  return (
    <div id="almanac_screen">
      <Conditions
        city={city}
        stationID={weatherStationResponse.stationID}
        conditions={observed}
        stationTime={stationTime}
        showPressure
        airQuality={airQuality}
      />

      <div className="forecast-hardware-text-column forecast-hardware-text-column--almanac-records">
        <div> Last Year Normal Records{"".padEnd(2)}Year</div>
        <div>
          {"Hi".padStart(3)} {lastYear.hi} {normal.hi} {recordHiVal} {String(recordHiYr ?? "N/A").padStart(4)}
        </div>
        <div>
          {"Lo".padStart(3)} {lastYear.lo} {normal.lo} {recordLoVal} {String(recordLoYr ?? "N/A").padStart(4)}
        </div>
      </div>
    </div>
  );
}
