import { adjustObservedDateTimeToStationTime } from "lib/date";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo } from "react";
import { ProvinceTracking, WeatherStationTimeData } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type ProvinceTrackingProps = {
  tracking: ProvinceTracking;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

export function ProvinceTrackingScreen(props: ProvinceTrackingProps) {
  const { tracking, weatherStationTime, onComplete } = props ?? {};
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const { tracking: stations = null, isOvernight = true, yesterdayPrecipDate } = tracking ?? {};

  useEffect(() => {
    if (!stations?.length) onCompleteRef.current();
  }, [tracking]);

  const stationTime = useMemo(() => {
    if (!weatherStationTime?.observedDateTime) return null;
    return adjustObservedDateTimeToStationTime(weatherStationTime);
  }, [yesterdayPrecipDate, weatherStationTime?.observedDateTime]);

  if (!stations?.length) return <></>;

  // precip string must be longer than 13 chars
  const precipString = (precip: string | number | null | undefined, unit: string) => {
    if (typeof precip === "string") return precip;
    if (precip === null || precip === undefined) return "NIL".padStart(5);

    const precipNumber = Number(precip);
    if (!Number.isFinite(precipNumber)) return "NIL".padStart(5);

    // less than 0.2mm is trace amounts (0 is a real measured zero, not missing)
    if (precipNumber > 0 && precipNumber < 0.2) return "TRACE";

    const noPrecipType = unit.length === 2;
    if (precipNumber === 0) {
      return `${noPrecipType ? "".padStart(2) : ""}0.0 ${unit ?? "mm"}`.toUpperCase();
    }
    return `${noPrecipType ? "".padStart(2) : ""}${precipNumber.toFixed(1)} ${unit ?? "mm"}`.toUpperCase();
  };

  const formatTemp = (temp: number | string) => {
    if (typeof temp === "string") return temp;

    const tempNumber = Number(temp);
    return `${Math.round(tempNumber)}`;
  };

  /** Same column widths as each `<li>` row so headers line up (10 + 10 + 5 + precip). */
  const tempColW = 10;
  const headHighLow = isOvernight ? "Overnight" : "High";
  const headYesterdayToday = isOvernight
    ? "Low:"
    : stationTime != null && stationTime.getHours() < 20
      ? "Yesterday:"
      : "Today:";

  return (
    <div id="province_tracking_screen">
      <div>
        <span>{"".padEnd(10)}</span>
        <span>{headHighLow.padStart(tempColW)}</span>
        <span>{"".padEnd(5)}</span>
        <span>24H PRECIP</span>
      </div>
      <div>
        <span>{"".padEnd(10)}</span>
        <span>{headYesterdayToday.padStart(tempColW)}</span>
        <span>{"".padEnd(5)}</span>
        <span>for {yesterdayPrecipDate}</span>
      </div>
      <ol>
        {stations.map((station) => (
          <li key={station.station.code}>
            <span>{station.station.name.slice(0, 10).replace(/[-_/]/g, "").padEnd(10)}</span>
            <span>{formatTemp(station.displayTemp).padStart(tempColW)}</span>
            <span>{"".padEnd(5)}</span>
            <span>{precipString(station.yesterdayPrecip, station.yesterdayPrecipUnit)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
