import { compareAsc, compareDesc, parseISO } from "date-fns";

export function getIsWinterSeason(month?: number) {
  // remember that months are 0 indexed
  const date: Date = new Date();
  if (month === undefined) month = date?.getMonth() + 1;

  // if the month is october or greater, and march or less, its winter season
  return month >= 10 || month <= 3;
}

export function isWindchillSeason(month?: number) {
  // remember that months are 0 indexed
  const date: Date = new Date();
  if (month === undefined) month = date?.getMonth() + 1;

  // if the month is november or greater, and april or less, its windchill season
  return month >= 11 || month <= 4;
}

export function isSunSpotSeason(month?: number) {
  const date: Date = new Date();
  if (month === undefined) month = date?.getMonth() + 1;

  // if the month is feb/march then its sunspot season
  return month >= 2 && month < 4;
}

export function isDateInWinterSeason(isoDate: string) {
  const date = parseISO(isoDate);
  return getIsWinterSeason(date.getMonth() + 1);
}

/** @param asOf Reference “today” for which winter season window to use (defaults to runtime clock). Pass observed station date when aggregating climate bulk data. */
export function isDateInCurrentWinterSeason(isoDate: string, asOf: Date = new Date()) {
  const currentMonth = asOf.getMonth() + 1;
  const currentYear = asOf.getFullYear();
  const lastYear = asOf.getFullYear() - 1;
  const nextYear = asOf.getFullYear() + 1;

  let startOfCurrentWinterSeason = null;
  let endOfCurrentWinterSeason = null;

  // if the month is oct-dec then we want this years data
  // for oct-dec and next years data for jan-mar
  if (currentMonth >= 10) {
    startOfCurrentWinterSeason = parseISO(`${currentYear}-10-01`);
    endOfCurrentWinterSeason = parseISO(`${nextYear}-03-31`);
  } else {
    // if the month is before oct then we want last years data
    // for oct-dec and this years data for jan-mar
    startOfCurrentWinterSeason = parseISO(`${lastYear}-10-01`);
    endOfCurrentWinterSeason = parseISO(`${currentYear}-03-31`);
  }

  // winter season is october 1st to march 31st
  const dateToCheck = parseISO(isoDate);

  // now we have all of our dates, we can compare them
  return (
    compareDesc(startOfCurrentWinterSeason, dateToCheck) !== -1 &&
    compareAsc(endOfCurrentWinterSeason, dateToCheck) !== -1
  );
}

/** @param asOf Reference date for which calendar year’s Apr–Sep window to use (defaults to runtime clock). */
export function isDateInCurrentSummerSeason(isoDate: string, asOf: Date = new Date()) {
  const currentYear = asOf.getFullYear();

  // winter season is october 1st to march 31st
  const startOfCurrentSummerSeason = parseISO(`${currentYear}-04-01`);
  const endOfCurrentSummerSeason = parseISO(`${currentYear}-09-30`);
  const dateToCheck = parseISO(isoDate);

  // now we have all of our dates, we can compare them
  return (
    compareDesc(startOfCurrentSummerSeason, dateToCheck) !== -1 &&
    compareAsc(endOfCurrentSummerSeason, dateToCheck) !== -1
  );
}
