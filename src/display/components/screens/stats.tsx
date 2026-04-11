import { STATS_SCREEN_MAX_CHARACTERS_PER_LINE } from "consts";
import { addMinutes, format, isValid, parseISO } from "date-fns";
import { formatObservedMonthDate, getIsWinterSeason } from "lib/date";
import { useMemo } from "react";
import { HotColdSpots, Season, SunRiseSet, WeatherStationTimeData } from "types";

type StatsScreenProps = {
  city: string;
  weatherStationTime: WeatherStationTimeData;
  season: Season;
  sunRiseSet: SunRiseSet;
  hotColdSpots: HotColdSpots;
};

const PRECIP_CHARS_USED_OUTSIDE_OF_DOTS = 16;
const NORMAL_PRECIP_CHARS_USED_OUTSIDE_OF_DOTS = 12;
const HOT_COLD_SPOT_CHARS_USED_OUTSIDE_OF_DOTS = 9;

export function StatsScreen(props: StatsScreenProps) {
  const { city, weatherStationTime, season: seasonStats, sunRiseSet, hotColdSpots } = props ?? {};

  const { season, seasonPrecip } = seasonStats ?? {};

  const parseDate = (isoDate: string) => parseISO(isoDate);

  const formattedDate = useMemo(
    () => weatherStationTime?.observedDateTime && formatObservedMonthDate(weatherStationTime, true),
    [weatherStationTime?.observedDateTime]
  );

  const formattedHotColdSpotDate = useMemo(() => {
    const date = parseDate(hotColdSpots?.lastUpdated);
    if (!isValid(date)) return "";

    return format(addMinutes(date, weatherStationTime?.stationOffsetMinutesFromLocal ?? 0), "MMM d");
  }, [hotColdSpots?.lastUpdated, weatherStationTime?.stationOffsetMinutesFromLocal]);

  const formattedSunrise = useMemo(() => {
    const date = parseDate(sunRiseSet?.rise);
    if (!isValid(date)) return "";

    return format(addMinutes(date, weatherStationTime?.stationOffsetMinutesFromLocal ?? 0), "h:mm");
  }, [sunRiseSet?.rise, weatherStationTime?.stationOffsetMinutesFromLocal]);

  const formattedSunset = useMemo(() => {
    const date = parseDate(sunRiseSet?.set);
    if (!isValid(date)) return "";

    return format(addMinutes(date, weatherStationTime?.stationOffsetMinutesFromLocal ?? 0), "h:mm");
  }, [sunRiseSet?.set, weatherStationTime?.stationOffsetMinutesFromLocal]);

  /** Single line (≤ STATS_SCREEN_MAX_CHARACTERS_PER_LINE) so the plate does not clip the row below. */
  const sunriseSunsetLine = useMemo(() => {
    if (!formattedSunrise && !formattedSunset) return "";
    const a = formattedSunrise ? `Sunrise..${formattedSunrise}a` : "";
    const b = formattedSunset ? `Sunset..${formattedSunset}p` : "";
    if (a && b) return `${a} ${b}`;
    return a || b;
  }, [formattedSunrise, formattedSunset]);

  const generatePrecip = (amount: number) => amount.toFixed(1).padStart(5);

  const generateDotsForPrecipLine = (dataName: string, usedChars = PRECIP_CHARS_USED_OUTSIDE_OF_DOTS) =>
    "".padEnd(STATS_SCREEN_MAX_CHARACTERS_PER_LINE - (dataName.length + usedChars), ".");

  /** Match server-side seasonal precip window to the station’s observed calendar month (not only the browser clock). */
  const seasonStartMonth = useMemo(() => {
    if (!weatherStationTime?.observedDateTime) return getIsWinterSeason() ? "October" : "April";
    const d = parseISO(weatherStationTime.observedDateTime);
    if (!isValid(d)) return getIsWinterSeason() ? "October" : "April";
    return getIsWinterSeason(d.getMonth() + 1) ? "October" : "April";
  }, [weatherStationTime?.observedDateTime]);

  const actualPrecip = generatePrecip(seasonPrecip?.amount || 0);
  const normalPrecip = generatePrecip(seasonPrecip?.normal || 0);

  const { hotSpot, coldSpot } = hotColdSpots ?? {};
  const hotSpotName = hotSpot?.name?.trim() || "N/A";
  const coldSpotName = coldSpot?.name?.trim() || "N/A";

  const generateDotsForHotColdSpotLine = (prefix: string) =>
    "".padEnd(
      Math.max(
        0,
        STATS_SCREEN_MAX_CHARACTERS_PER_LINE - (prefix.length + HOT_COLD_SPOT_CHARS_USED_OUTSIDE_OF_DOTS)
      ),
      "."
    );

  const formatTempForHotColdSpotLine = (temperature?: number | null) =>
    (!isNaN(temperature) && temperature != null ? Math.round(temperature) : "N/A").toString().padStart(3);

  if (!city || !weatherStationTime?.observedDateTime || !season) return <></>;

  const cityTrim = city.trim();

  return (
    <div id="stats_screen">
      <div>
        {cityTrim} statistics - {formattedDate}
      </div>
      {sunriseSunsetLine ? <div>{sunriseSunsetLine}</div> : null}
      <div>{"".padStart(4)}Total precipitation since</div>
      <div>
        {"".padStart(2)}
        {seasonStartMonth} 1st {generateDotsForPrecipLine(seasonStartMonth)}
        {actualPrecip} mm
      </div>
      <div>
        {"".padStart(2)}
        Normal {generateDotsForPrecipLine("Normal", NORMAL_PRECIP_CHARS_USED_OUTSIDE_OF_DOTS)}
        {normalPrecip} mm
      </div>
      {hotColdSpots ? (
        <>
          <div>Canadian Hot/Cold Spot - {formattedHotColdSpotDate}</div>
          <div>
            {hotSpotName}, {hotSpot?.province ?? ""}{" "}
            {generateDotsForHotColdSpotLine(`${hotSpotName}, ${hotSpot?.province ?? ""} `)}
            {formatTempForHotColdSpotLine(hotSpot?.temperature)}
          </div>
          <div>
            {coldSpotName}, {coldSpot?.province ?? "N/A"}{" "}
            {generateDotsForHotColdSpotLine(`${coldSpotName}, ${coldSpot?.province ?? "N/A"} `)}
            {formatTempForHotColdSpotLine(coldSpot?.temperature)}
          </div>
        </>
      ) : null}
    </div>
  );
}
