import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SCREEN_BACKGROUND_BLUE, SCREEN_BACKGROUND_RED, SCREEN_NAMES, Screens } from "consts";
import { getAqhiCityAbbreviation } from "lib/display/outlookRegionalLabel";
import {
  buildChannelPlaylist,
  getChannelPlaylistStructureKey,
  type ChannelPlaylistEntry,
} from "lib/display/channelPlaylist";
import { isAutomaticScreen, resolveScreenDwellSeconds } from "lib/flavour/utils";
import {
  AQHIObservationResponse,
  AuthenticRefreshConfig,
  CAPObject,
  FlavourScreen,
  GfxFeatureFlags,
  HotColdSpots,
  LastMonth,
  NationalWeather,
  ProvinceTracking,
  Season,
  SunspotStationObservations,
  NationalStationObservations,
  USAStationObservations,
  WeatherStation,
} from "types";
import {
  AlmanacScreen,
  ForecastScreen,
  AlertScreen,
  OutlookScreen,
  NationalWeatherScreen,
  ProvinceTrackingScreen,
  StatsScreen,
  LastMonthScreen,
  SunspotScreen,
  WindchillEffectScreen,
  AQHIWarningScreen,
  InfoScreen,
  AirportMetarScreen,
} from "./screens";

type ScreenRotatorProps = {
  screens: FlavourScreen[];
  weatherStationResponse: WeatherStation;
  alerts: {
    alerts: CAPObject[];
    mostImportantAlert: CAPObject;
    hasFetched: boolean;
  };
  nationalWeather: NationalWeather;
  provinceTracking: ProvinceTracking;
  season: Season;
  hotColdSpots: HotColdSpots;
  lastMonth: LastMonth | undefined;
  /** After first `season/lastmonth` round-trip; avoids skipping the screen before data arrives. */
  lastMonthFetchAttempted: boolean;
  usaWeather: USAStationObservations;
  /** ICAO METAR rows when `airportMetarStations` is set in config. */
  airportMetar: NationalStationObservations;
  sunspots: SunspotStationObservations;
  /** After first sunspots poll; avoids skipping before the list loads in sunspot season. */
  sunspotsFetchAttempted: boolean;
  airQuality: AQHIObservationResponse;
  configVersion: string;
  /** Matches `gfx.retro.reloadLineMs` / `--gfx-reload-line-ms` for forecast reload line timing. */
  reloadLineMs?: number;
  authenticRefresh?: AuthenticRefreshConfig;
  gfxFeatures?: GfxFeatureFlags;
  /** Shown when the flavour includes {@link Screens.INFO} (`infoScreen` in init). */
  infoScreenLines?: string[];
};

function getPlaylistEntryTitle(entry: ChannelPlaylistEntry | undefined, city: string | undefined): string {
  if (!entry) return "";
  const cityTrim = city?.trim();
  const cityTag = cityTrim ? ` — ${cityTrim.slice(0, 22).toUpperCase()}` : "";
  if (entry.kind === "forecast_page") return `${SCREEN_NAMES[Screens.FORECAST]}${cityTag}`;
  if (entry.kind === "outlook_page") return `${SCREEN_NAMES[Screens.OUTLOOK]}${cityTag}`;
  const name = SCREEN_NAMES[entry.screen.id as Screens] ?? "";
  return `${name}${cityTag}`.trim();
}

export function ScreenRotator(props: ScreenRotatorProps) {
  const {
    screens = [],
    weatherStationResponse,
    alerts,
    nationalWeather,
    provinceTracking,
    season,
    hotColdSpots,
    lastMonth,
    lastMonthFetchAttempted,
    usaWeather,
    airportMetar,
    sunspots,
    sunspotsFetchAttempted,
    airQuality,
    configVersion,
    reloadLineMs,
    authenticRefresh,
    gfxFeatures,
    infoScreenLines,
  } = props ?? {};

  const { channelPlaylist, playlistStructureKey } = useMemo(() => {
    const pl = buildChannelPlaylist(screens ?? [], {
      weatherStationResponse,
      alert: alerts?.mostImportantAlert,
    });
    return { channelPlaylist: pl, playlistStructureKey: getChannelPlaylistStructureKey(pl) };
  }, [screens, weatherStationResponse, alerts?.mostImportantAlert]);

  /** Bumps when observation/config changes or playlist topology changes (e.g. alert clears → fewer forecast pages). */
  const playlistGenerationKey = useMemo(
    () =>
      `${weatherStationResponse?.observationID ?? "na"}|${configVersion}|${playlistStructureKey}`,
    [weatherStationResponse?.observationID, configVersion, playlistStructureKey]
  );

  const [displayedPlaylistIx, setDisplayedPlaylistIx] = useState(-1);
  const [conditionsOrConfigUpdated, setConditionsOrConfigUpdated] = useState(false);
  const [backgroundColour, setBackgroundColour] = useState(SCREEN_BACKGROUND_BLUE);

  const screenRotatorTimeout = useRef<NodeJS.Timeout>(null);
  const backgroundRotatorTimeout = useRef<NodeJS.Timeout>(null);
  /** Coalesce rapid playlist steps so each still flips blue/red (debounced timer used to drop toggles). */
  const pendingBackgroundToggles = useRef(0);

  const playlistInputRef = useRef({ screens, weatherStationResponse, alerts });
  playlistInputRef.current = { screens, weatherStationResponse, alerts };

  // basic rotation of screens
  useEffect(() => {
    if (!channelPlaylist?.length) return;

    // displayed screen is set to -1 so we need to start displaying something
    if (displayedPlaylistIx === -1) setDisplayedPlaylistIx(0);
    else prepareSwitchToNextScreen();
  }, [displayedPlaylistIx, channelPlaylist.length, configVersion]);

  // used to clear the screen switching timeout
  useEffect(() => {
    return () => {
      screenRotatorTimeout.current && clearTimeout(screenRotatorTimeout.current);
      backgroundRotatorTimeout.current && clearTimeout(backgroundRotatorTimeout.current);
    };
  }, []);

  // Full playlist reset + reload styling when observation/config changes or playlist shape changes.
  useEffect(() => {
    screenRotatorTimeout.current && clearTimeout(screenRotatorTimeout.current);

    const { screens: s, weatherStationResponse: w, alerts: a } = playlistInputRef.current;
    const playlist = buildChannelPlaylist(s ?? [], {
      weatherStationResponse: w,
      alert: a?.mostImportantAlert,
    });

    setConditionsOrConfigUpdated(true);
    setBackgroundColour(SCREEN_BACKGROUND_BLUE);

    if (!playlist.length) {
      setDisplayedPlaylistIx(-1);
      return;
    }

    const forecastHeadIx = playlist.findIndex((e) => e.kind === "forecast_page" && e.pageIndex === 0);
    setDisplayedPlaylistIx(forecastHeadIx !== -1 ? forecastHeadIx : 0);
  }, [playlistGenerationKey]);

  const switchBackgroundColour = () => {
    pendingBackgroundToggles.current += 1;
    if (backgroundRotatorTimeout.current) return;

    backgroundRotatorTimeout.current = setTimeout(() => {
      const steps = pendingBackgroundToggles.current;
      pendingBackgroundToggles.current = 0;
      if (steps > 0) {
        setBackgroundColour((c) => {
          let next = c;
          for (let i = 0; i < steps; i++) {
            next = next === SCREEN_BACKGROUND_BLUE ? SCREEN_BACKGROUND_RED : SCREEN_BACKGROUND_BLUE;
          }
          return next;
        });
      }
      backgroundRotatorTimeout.current = null;
    }, 20);
  };

  const prepareSwitchToNextScreen = (): void => {
    // clear the timeout if a timed screen got skipped due to lack of content
    screenRotatorTimeout.current && clearTimeout(screenRotatorTimeout.current);

    const entry = channelPlaylist[displayedPlaylistIx];
    if (!entry) return;

    if (entry.kind === "forecast_page") {
      screenRotatorTimeout.current = null;
    } else {
      const screen = entry.screen;
      if (!isAutomaticScreen(screen.id)) {
        const dwellMs = resolveScreenDwellSeconds(screen) * 1000;
        screenRotatorTimeout.current = setTimeout(() => switchToNextScreen(), dwellMs);
      } else screenRotatorTimeout.current = null;
    }

    // 20ms after index changes, switch the background colour. should be enough time for screens that
    // decide if they show or not to complete that action
    if (!conditionsOrConfigUpdated) switchBackgroundColour();
  };

  const switchToNextScreen = () => {
    setDisplayedPlaylistIx((prev) => {
      const len = channelPlaylist.length;
      if (len === 0) return -1;
      return (prev + 1) % len;
    });
    setConditionsOrConfigUpdated(false);
  };

  /** Widescreen pillar fill: match the active screen background outside the 4:3 raster. */
  useLayoutEffect(() => {
    const host = document.getElementById("weather_channel");
    if (!host) return;
    host.style.setProperty("--rwc-pillar-color", backgroundColour);
  }, [backgroundColour]);

  const getComponentForDisplayedScreen = () => {
    const entry = channelPlaylist[displayedPlaylistIx];
    if (!entry) return <></>;

    if (entry.kind === "forecast_page") {
      return (
        <ForecastScreen
          key={`${weatherStationResponse?.observationID ?? "na"}-fc-${entry.pageIndex}`}
          weatherStationResponse={weatherStationResponse}
          forecastBodies={entry.bodies}
          forecastPageIndex={entry.pageIndex}
          alert={alerts?.mostImportantAlert}
          isReload={conditionsOrConfigUpdated}
          airQuality={airQuality}
          reloadLineMs={reloadLineMs}
          authenticRefresh={authenticRefresh}
          authenticRefreshEnabled={gfxFeatures?.authenticRefreshEnabled}
          configVersion={configVersion}
          secondsPerPage={resolveScreenDwellSeconds(entry.screen)}
          onComplete={switchToNextScreen}
        />
      );
    }

    if (entry.kind === "outlook_page") {
      return (
        <OutlookScreen
          key={`${weatherStationResponse?.observationID ?? "na"}-ol-${entry.pageIndex}`}
          weatherStationResponse={weatherStationResponse}
          outlookBodies={entry.bodies}
          outlookPageIndex={entry.pageIndex}
        />
      );
    }

    const screen = entry.screen;

    switch (screen.id as Screens) {
      case Screens.ALERTS:
        return (
          <AlertScreen
            secondsPerPage={resolveScreenDwellSeconds(screen)}
            onComplete={switchToNextScreen}
            {...alerts}
          />
        );

      case Screens.ALMANAC:
        return <AlmanacScreen weatherStationResponse={weatherStationResponse} airQuality={airQuality} />;

      case Screens.AQHI_WARNING:
        return (
          <AQHIWarningScreen
            city={getAqhiCityAbbreviation(
              weatherStationResponse?.stationID ?? "",
              weatherStationResponse?.city
            )}
            airQuality={airQuality}
            onComplete={switchToNextScreen}
          />
        );

      case Screens.PROVINCE_PRECIP:
        return (
          <ProvinceTrackingScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            tracking={provinceTracking}
            onComplete={switchToNextScreen}
          />
        );

      case Screens.CANADA_TEMP_CONDITIONS_MB:
        return (
          <NationalWeatherScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            observations={nationalWeather?.mb}
            area="MB"
            onComplete={switchToNextScreen}
          />
        );

      case Screens.CANADA_TEMP_CONDITIONS_WEST:
        return (
          <NationalWeatherScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            observations={nationalWeather?.west}
            area="WEST"
            onComplete={switchToNextScreen}
          />
        );

      case Screens.CANADA_TEMP_CONDITIONS_EAST:
        return (
          <NationalWeatherScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            observations={nationalWeather?.east}
            area="EAST"
            onComplete={switchToNextScreen}
          />
        );

      case Screens.USA_TEMP_CONDITIONS:
        // yeah i know it uses national weather screen but its literally the same display
        return (
          <NationalWeatherScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            observations={usaWeather}
            area="USA"
            onComplete={switchToNextScreen}
          />
        );

      case Screens.AIRPORT_METAR:
        return (
          <AirportMetarScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            observations={airportMetar ?? []}
            onComplete={switchToNextScreen}
          />
        );

      case Screens.STATS:
        return (
          <StatsScreen
            weatherStationTime={weatherStationResponse?.stationTime}
            season={season}
            sunRiseSet={weatherStationResponse?.almanac?.sunRiseSet}
            city={weatherStationResponse?.city}
            hotColdSpots={hotColdSpots}
          />
        );

      case Screens.LAST_MONTH_STATS:
        return (
          <LastMonthScreen
            city={weatherStationResponse?.city}
            lastMonth={lastMonth}
            lastMonthFetchAttempted={lastMonthFetchAttempted}
            onComplete={switchToNextScreen}
          />
        );

      case Screens.SUNSPOTS:
        return (
          <SunspotScreen
            sunspots={sunspots}
            sunspotsFetchAttempted={sunspotsFetchAttempted}
            weatherStationTime={weatherStationResponse?.stationTime}
            onComplete={switchToNextScreen}
          />
        );

      case Screens.WINDCHILL:
        return <WindchillEffectScreen onComplete={switchToNextScreen} />;

      case Screens.INFO:
        return <InfoScreen lines={infoScreenLines ?? []} />;
    }

    return <></>;
  };

  const activeEntry = channelPlaylist[displayedPlaylistIx];
  const screenTitle = getPlaylistEntryTitle(activeEntry, weatherStationResponse?.city);

  return (
    <div
      id="display"
      style={{
        backgroundColor: backgroundColour,
      }}
    >
      {screenTitle ? <div id="rwc-screen-title">{screenTitle}</div> : null}
      <div id="rwc-screen-body">{getComponentForDisplayedScreen()}</div>
    </div>
  );
}
