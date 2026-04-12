import {
  PROVINCE_TRACKING_NAME_FIELD_WIDTH,
  PROVINCE_TRACKING_TEMP_PRECIP_GAP_WIDTH,
} from "consts/provincetracking.consts";
import { adjustObservedDateTimeToStationTime } from "lib/date";
import { formatProvinceYesterdayPrecipDisplay } from "lib/display/provinceYesterdayPrecipDisplay";
import { coerceArray } from "lib/display/safeData";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo } from "react";
import { ProvinceStationTracking, ProvinceTracking, WeatherStationTimeData } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type ProvinceTrackingProps = {
  tracking: ProvinceTracking;
  weatherStationTime: WeatherStationTimeData;
} & AutomaticScreenProps;

export function ProvinceTrackingScreen(props: ProvinceTrackingProps) {
  const { tracking, weatherStationTime, onComplete } = props ?? {};
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const { tracking: stationsRaw, isOvernight = true, yesterdayPrecipDate } = tracking ?? {};
  const stations = coerceArray<ProvinceStationTracking>(stationsRaw);

  useEffect(() => {
    if (!stations.length) onCompleteRef.current();
  }, [stations.length, tracking]);

  const stationTime = useMemo(() => {
    if (!weatherStationTime?.observedDateTime) return null;
    return adjustObservedDateTimeToStationTime(weatherStationTime);
  }, [yesterdayPrecipDate, weatherStationTime?.observedDateTime]);

  if (!stations.length) return <></>;

  const formatTemp = (temp: number | string) => {
    if (typeof temp === "string") return temp;

    const tempNumber = Number(temp);
    if (!Number.isFinite(tempNumber)) return "N/A";
    return `${Math.round(tempNumber)}`;
  };

  /** Same column widths as each `<li>` row so headers line up (name + temp + gap + precip). */
  const nameColW = PROVINCE_TRACKING_NAME_FIELD_WIDTH;
  const tempColW = 10;
  const gapColW = PROVINCE_TRACKING_TEMP_PRECIP_GAP_WIDTH;
  const headHighLow = isOvernight ? "Overnight" : "High";
  const headYesterdayToday = isOvernight
    ? "Low:"
    : stationTime != null && stationTime.getHours() < 20
      ? "Yesterday:"
      : "Today:";

  return (
    <div id="province_tracking_screen">
      <div>
        <span>{"".padEnd(nameColW)}</span>
        <span>{headHighLow.padStart(tempColW)}</span>
        <span>{"".padEnd(gapColW)}</span>
        <span>24H PRECIP</span>
      </div>
      <div>
        <span>{"".padEnd(nameColW)}</span>
        <span>{headYesterdayToday.padStart(tempColW)}</span>
        <span>{"".padEnd(gapColW)}</span>
        <span>for {yesterdayPrecipDate}</span>
      </div>
      <ol>
        {stations.map((station, ix) => (
          <li key={station?.station?.code != null ? String(station.station.code) : `pt-${ix}`}>
            <span>
              {(station?.station?.name ?? "")
                .slice(0, nameColW)
                .replace(/[-_/]/g, "")
                .padEnd(nameColW)}
            </span>
            <span>{formatTemp(station?.displayTemp ?? 0).padStart(tempColW)}</span>
            <span>{"".padEnd(gapColW)}</span>
            <span>{formatProvinceYesterdayPrecipDisplay(station?.yesterdayPrecip, station?.yesterdayPrecipUnit)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
