export enum Screens {
  ALERTS,
  FORECAST,
  OUTLOOK,
  ALMANAC,
  AQHI_WARNING,
  PROVINCE_PRECIP,
  CANADA_TEMP_CONDITIONS_MB,
  CANADA_TEMP_CONDITIONS_WEST,
  CANADA_TEMP_CONDITIONS_EAST,
  USA_TEMP_CONDITIONS,
  STATS,
  LAST_MONTH_STATS,
  INFO,
  SUNSPOTS,
  WINDCHILL,
  /** ICAO METAR (AWC) — Canadian/US/international airports from config. */
  AIRPORT_METAR,
  CANADA_TEMP_CONDITIONS_ON,
  /** MSC/DRAO F10.7 flux plate (one rotator step). */
  SUNSPOTS_SOLAR_FLUX,
  /** NOAA SWPC ISN + F10.7 plate (one rotator step). */
  SUNSPOTS_NOAA_SWPC,
  /** NWS warm-city tropical outlook (Feb–Mar; one rotator step). */
  SUNSPOTS_TROPICAL,
}

/** Highest numeric {@link Screens} id accepted in flavour JSON ({@link FlavourLoader}). */
export const SCREENS_MAX_FLAVOUR_SCREEN_ID = Screens.SUNSPOTS_TROPICAL;

export const SCREEN_NAMES = {
  [Screens.ALERTS]: "Alerts",
  [Screens.FORECAST]: "Forecast",
  [Screens.OUTLOOK]: "Outlook",
  [Screens.ALMANAC]: "Almanac",
  [Screens.AQHI_WARNING]: "AQHI Warning",
  [Screens.PROVINCE_PRECIP]: "Province Temp/Precip",
  [Screens.CANADA_TEMP_CONDITIONS_MB]: "Conditions in Manitoba",
  [Screens.CANADA_TEMP_CONDITIONS_WEST]: "Conditions on the West Coast",
  [Screens.CANADA_TEMP_CONDITIONS_EAST]: "Conditions on the East Coast",
  [Screens.USA_TEMP_CONDITIONS]: "Conditions in the USA",
  [Screens.STATS]: "Weather Station Stats",
  [Screens.LAST_MONTH_STATS]: "Last month's stats",
  [Screens.INFO]: "Info screen",
  [Screens.SUNSPOTS]: "Sunspot forecast",
  [Screens.WINDCHILL]: "Windchill Explanation",
  [Screens.AIRPORT_METAR]: "Airport METAR",
  [Screens.CANADA_TEMP_CONDITIONS_ON]: "Conditions in Ontario",
  [Screens.SUNSPOTS_SOLAR_FLUX]: "Solar flux (F10.7)",
  [Screens.SUNSPOTS_NOAA_SWPC]: "NOAA SWPC cycle",
  [Screens.SUNSPOTS_TROPICAL]: "NWS tropical sunspot outlook",
};

export const SCREEN_DESCRIPTIONS = {
  [Screens.ALERTS]: "Paginated alerts/warnings/watches/etc.",
  [Screens.FORECAST]:
    "Current conditions (without pressure) with the immediate forecast; long text uses forecast cont.. pages; additional forecast periods each paginate as needed",
  [Screens.OUTLOOK]: "Long-term forecast for the current city - displays high/low temps and expected conditions",
  [Screens.ALMANAC]: "Current conditions and high/low temperature info for last year, normal, and the record",
  [Screens.AQHI_WARNING]: "Relevant warning screen if AQHI for the current weather station is above 3",
  [Screens.PROVINCE_PRECIP]: "Highest or lowest recorded temperature for the day plus the previous day's precipitation",
  [Screens.CANADA_TEMP_CONDITIONS_MB]: "List of Manitoba cities with the current temperature and conditions",
  [Screens.CANADA_TEMP_CONDITIONS_WEST]:
    "Up to seven cities across BC, AB, SK, MB, YT, NT, and NU with current temperature and conditions",
  [Screens.CANADA_TEMP_CONDITIONS_EAST]:
    "Up to seven cities across Ontario, Quebec, and the Atlantic provinces with current temperature and conditions",
  [Screens.USA_TEMP_CONDITIONS]: "List of US cities with the current temperature and conditions",
  [Screens.STATS]:
    "Screen showing sunrise/set for the day, along with seasonal precipitation stats and the hot/cold spots in Canada",
  [Screens.LAST_MONTH_STATS]:
    "Statitics about the last month with temperature, precipitation, and hotest/coldest days recorded",
  [Screens.INFO]: "Custom text only info screens written by the user",
  [Screens.SUNSPOTS]: "List of forecast for warmer cities during the winter",
  // [Screens.RANDOM]: "Random selection from a pre-determined list of screens",
  [Screens.WINDCHILL]: "Explains the windchill numbers",
  [Screens.AIRPORT_METAR]:
    "Selected ICAO stations — temperatures and flight category / sky from NOAA AWC METAR (same feed as USA backup)",
  [Screens.CANADA_TEMP_CONDITIONS_ON]: "List of Ontario cities with the current temperature and conditions",
  [Screens.SUNSPOTS_SOLAR_FLUX]: "MSC/DRAO 10.7 cm solar flux (SFU) for the latest UTC interval",
  [Screens.SUNSPOTS_NOAA_SWPC]: "NOAA Space Weather Prediction Center estimated sunspot number and F10.7",
  [Screens.SUNSPOTS_TROPICAL]: "NWS grid warm-city outlook shown during sunspot season (Feb–Mar)",
};

/** Rotator does not arm an outer dwell timer — the screen advances itself (per-page timers inside the component). */
export const SCREENS_WITH_AUTO_DURATION = [Screens.ALERTS, Screens.FORECAST];

export const SCREEN_DEFAULT_DISPLAY_LENGTH = 14 as const;
export const SCREEN_MIN_DISPLAY_LENGTH = 2 as const;
export const SCREEN_ALERT_DISPLAY_LENGTH = 300 as const;
export const SCREEN_INFO_DISPLAY_LENGTH = 14 * 25;
export const SCREEN_FORECAST_DISPLAY_LENGTH = 180 as const;

export const SCREEN_BACKGROUND_BLUE = "rgb(0,0,135)";
export const SCREEN_BACKGROUND_BLUE_TEXT_COL = "rgb(193,192,250)";
export const SCREEN_BACKGROUND_RED = "#610b00";
export const SCREEN_BACKGROUND_RED_TEXT_COL = "rgb(227,168,139)";
