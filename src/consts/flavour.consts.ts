import { SCREEN_DEFAULT_DISPLAY_LENGTH, SCREEN_MIN_DISPLAY_LENGTH, Screens } from "./screens.consts";

export const FLAVOUR_DIRECTORY = "cfg/flavours";
export const FLAVOUR_NAME_MAX_LENGTH = 32;

/**
 * On-air cable-style default playlist (~14s steps, duplicate alerts at the end).
 * Matches the shipped `default` flavour intent; used as the **on-air cable** new-flavour template.
 */
export const FLAVOUR_DEFAULT = {
  name: "default",
  created: "2023-07-23T15:39:40",
  modified: "2023-07-23T15:39:40",
  screens: [
    {
      id: Screens.FORECAST,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.OUTLOOK,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.ALMANAC,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.ALERTS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.AQHI_WARNING,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.PROVINCE_PRECIP,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.CANADA_TEMP_CONDITIONS_MB,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.CANADA_TEMP_CONDITIONS_ON,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.CANADA_TEMP_CONDITIONS_WEST,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.CANADA_TEMP_CONDITIONS_EAST,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.USA_TEMP_CONDITIONS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.AIRPORT_METAR,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.SUNSPOTS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.STATS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.LAST_MONTH_STATS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    {
      id: Screens.WINDCHILL,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
    // {
    //   id: Screens.INFO,
    //   duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    // },
    {
      id: Screens.ALERTS,
      duration: SCREEN_DEFAULT_DISPLAY_LENGTH,
    },
  ],
};

/** One playlist row per {@link Screens} id, ascending by id — for quick previews / lab runs. */
export function buildFlavourScreensAllScreenTypes(
  duration: number = SCREEN_MIN_DISPLAY_LENGTH
): { id: Screens; duration: number }[] {
  const ids = (Object.values(Screens) as (keyof typeof Screens | Screens)[])
    .filter((v): v is Screens => typeof v === "number")
    .sort((a, b) => a - b);
  return ids.map((id) => ({ id, duration }));
}
