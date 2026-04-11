import { addDays, addMinutes, format, isValid, parseISO, subDays } from "date-fns";
import { WeatherStationTimeData } from "types";

export function formatDisplayDate(timestamp: number) {
  return format(timestamp, `EEE  MMM  dd`)
    .replace(/tue\s/gi, "tues")
    .replace(/thu\s/gi, "thur")
    .replace(/jun\s/gi, "june")
    .replace(/jul\s/gi, "july")
    .replace(/sep\s/gi, "sept")
    .replace(/\s0/, "  ");
}

export function adjustObservedDateTimeToStationTime(date: WeatherStationTimeData | null | undefined): Date {
  if (!date?.observedDateTime) return new Date();
  const parsed = parseISO(date.observedDateTime);
  if (!isValid(parsed)) return new Date();
  const off = date.stationOffsetMinutesFromLocal;
  const minutes = typeof off === "number" && Number.isFinite(off) ? off : 0;
  return addMinutes(parsed, minutes);
}

export function formatObservedLong(
  date: WeatherStationTimeData | null | undefined,
  handleMid: boolean = false,
  additionalTimeZonePadding: string = ""
) {
  if (!date?.observedDateTime) return "";

  const parsedDate = adjustObservedDateTimeToStationTime(date);
  if (!isValid(parsedDate)) return "";
  const timeZone = date.timezone;

  // is the right place to do this? idk
  // i dont wanna write an entire other function just for the screen
  // with the list of cities on it
  additionalTimeZonePadding = additionalTimeZonePadding || "";

  const hours = parsedDate.getHours();
  let hourTimezoneFormat = `h aa `;
  // we need to double space after timezone if its a single digit hour
  // otherwise it should be a single space because 10/11 eat into that space
  let timeZoneString = `'${timeZone} ${additionalTimeZonePadding}'`;
  if (hours < 10 || (hours > 12 && hours < 22)) timeZoneString = `'${timeZone}${additionalTimeZonePadding}  '`;

  // ammend this onto the hour format
  hourTimezoneFormat += timeZoneString;

  // handle midnight/noon
  if (handleMid) {
    if (hours === 12) hourTimezoneFormat = `'${"Noon".padEnd(10)}${additionalTimeZonePadding}'`;
    if (hours === 0) hourTimezoneFormat = `'${"Midnight".padEnd(10)}${additionalTimeZonePadding}'`;
  }

  // put it all together and format
  const monthDateYearFormat = `MMM dd/yy`;
  const dateString = format(parsedDate, `${hourTimezoneFormat}${monthDateYearFormat}`);

  // clear out leading 0s from time/date as we dont want those
  const displayDateString = dateString.replace(/\s0/, "  ");
  return displayDateString;
}

export function formatObservedMonthDate(date: WeatherStationTimeData | null | undefined, isLongMonths: boolean = false) {
  if (!date?.observedDateTime) return "";

  const parsedDate = adjustObservedDateTimeToStationTime(date);
  if (!isValid(parsedDate)) return "";
  const dateString = format(parsedDate, "MMM d");
  if (!isLongMonths) return dateString;

  return dateString;
}

export function formatSunspotDate(date: WeatherStationTimeData | null | undefined) {
  if (!date?.observedDateTime) return "";

  // if its after 12pm we look at the next day
  let parsedDate = adjustObservedDateTimeToStationTime(date);
  if (!isValid(parsedDate)) return "";
  if (parsedDate.getHours() >= 12) parsedDate = addDays(parsedDate, 1);

  const formatString = "MMM'. 'd";
  const formattedDate = format(parsedDate, formatString);
  return formattedDate.replace(/mar./gi, "March").replace(/apr./gi, "April");
}

export function getDaysAheadFromObserved(date: WeatherStationTimeData | null | undefined, numberOfDays: number = 6) {
  // lets turn it into a date and then count forward
  const parsedDate = adjustObservedDateTimeToStationTime(date);
  if (!isValid(parsedDate)) return new Date();
  return addDays(parsedDate, numberOfDays);
}

export function getDaysBehindFromObserved(date: WeatherStationTimeData | null | undefined, numberOfDays: number = 1) {
  // turn it into a date and count back
  const parsedDate = adjustObservedDateTimeToStationTime(date);
  if (!isValid(parsedDate)) return new Date();
  return subDays(parsedDate, numberOfDays);
}
