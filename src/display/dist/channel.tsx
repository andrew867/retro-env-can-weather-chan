import { CrawlerMessages } from "display/components/crawler";
import { FontModeApply } from "display/components/fontModeApply";
import { FooterBar } from "display/components/footerbar";
import { GfxRetroApply } from "display/components/gfxRetroApply";
import { GfxScanlinesLayer } from "display/components/gfxScanlinesLayer";
import { GfxVhsAnalogGrainLayer } from "display/components/gfxVhsAnalogGrainLayer";
import { VhsHeadSwitchTearLayer } from "display/components/vhsHeadSwitchTearLayer";
import { NextGenGfxLayer } from "display/components/nextGenGfxLayer";
import { PlaylistComponent } from "display/components/playlist";
import { AirportMetarScreen } from "display/components/screens/airportMetar";
import { ScreenRotator } from "display/components/screenrotator";
import {
  useAlerts,
  useCanadaHotColdSpots,
  useLastMonth,
  useUSAWeather,
  useAirportMetar,
  useProvinceTracking,
  useSeason,
  useWeatherEventStream,
  useNationalWeather,
  useSunspots,
} from "hooks";
import { useAirQuality } from "hooks/airQuality";
import { useConfig } from "hooks/init";
import axios from "lib/axios";
import {
  E2E_AIRPORT_METAR_OBSERVATIONS,
  E2E_AIRPORT_METAR_WEATHER_TIME,
  isE2eAirportMetarFixture,
} from "lib/display/e2eAirportMetarFixture";
import { getDisplayAxiosSnapshot } from "lib/displayUpstreamMetrics";
import { CLIENT_METRICS_POST_INTERVAL_MS, SCREEN_BACKGROUND_BLUE } from "consts";
import React, { useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import type { InitChannel } from "types";

/** Init / JSON may surface booleans as strings; treat anything else as false. */
function rwcBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return Boolean(v);
}

/** Visual-regression entry: `?e2eAirportMetar=1` — METAR plate only, no SSE (see Playwright `airport-metar-layout.spec.ts`). */
function E2eAirportMetarChannel({ config }: { config: InitChannel }) {
  const retro = config?.gfx?.retro;
  const vhsAnalogOn = rwcBool(retro?.vhsAnalogLayerEnabled);
  const scanlinesOn = !!(retro?.scanlinesOpacity && retro.scanlinesOpacity > 0.001);
  const vhsTearOn = vhsAnalogOn && rwcBool(retro?.vhsHeadSwitchTearEnabled);

  return (
    <>
      <GfxRetroApply gfx={config?.gfx} useOfficialFonts={config?.config.useOfficialFonts ?? true} />
      <FontModeApply useOfficialFonts={config?.config.useOfficialFonts ?? true} />
      <div className="rwc-channel-stack">
        <div className="rwc-channel-frame">
          <NextGenGfxLayer enabled={!!config?.gfx?.features?.nextGenVisualLayersEnabled} />
          <CrawlerMessages crawler={config?.crawler ?? []} />
          <div id="display" style={{ backgroundColor: SCREEN_BACKGROUND_BLUE }}>
            <div id="rwc-screen-body">
              <AirportMetarScreen
                observations={E2E_AIRPORT_METAR_OBSERVATIONS}
                weatherStationTime={E2E_AIRPORT_METAR_WEATHER_TIME}
                onComplete={() => {}}
              />
            </div>
          </div>
        </div>
        <div className="gfx-vignette-layer" aria-hidden />
        <GfxVhsAnalogGrainLayer enabled={vhsAnalogOn} />
        <VhsHeadSwitchTearLayer enabled={vhsTearOn} />
        <GfxScanlinesLayer enabled={scanlinesOn} />
      </div>
      <PlaylistComponent playlist={config?.music} />
    </>
  );
}

function WeatherChannel() {
  const { config, refetchConfig, initAttempted } = useConfig();
  const { nationalWeather, nationalDataFetchedAt, fetchNationalWeather } = useNationalWeather();
  const { provinceTracking, provinceDataFetchedAt, refetchProvinceTracking } = useProvinceTracking();
  const { season, fetchSeason } = useSeason();
  const { hotColdSpots, refetchHotColdSpots } = useCanadaHotColdSpots();
  const { lastMonth, fetchLastMonth, lastMonthFetchAttempted } = useLastMonth();
  const { usaWeather, fetchUSAWeather } = useUSAWeather();
  const { airportMetar, fetchAirportMetar } = useAirportMetar();
  const { sunspots, refetchSunspots, sunspotsFetchAttempted } = useSunspots();
  const { airQuality, airQualityDataFetchedAt, refetchAirQuality } = useAirQuality();

  const alertsHook = useAlerts();

  /** After server recovery or SSE reconnect, refresh all polled feeds so `X-RWC-Data-Fetched-At` headers update immediately (footer stale hint). */
  const refetchAllFeedsForFreshness = useCallback(() => {
    fetchSeason();
    fetchLastMonth();
    fetchNationalWeather();
    fetchUSAWeather();
    fetchAirportMetar();
    refetchProvinceTracking();
    refetchHotColdSpots();
    refetchSunspots();
    refetchAirQuality();
    alertsHook.refetchAlerts();
    refetchConfig();
  }, [
    fetchSeason,
    fetchLastMonth,
    fetchNationalWeather,
    fetchUSAWeather,
    fetchAirportMetar,
    refetchProvinceTracking,
    refetchHotColdSpots,
    refetchSunspots,
    refetchAirQuality,
    alertsHook.refetchAlerts,
    refetchConfig,
  ]);

  const { currentConditions } = useWeatherEventStream({
    onStreamConnected: refetchAllFeedsForFreshness,
  });

  useEffect(() => {
    const post = () => {
      axios.post("metrics/client", { displayAxios: getDisplayAxiosSnapshot() }).catch(() => {});
    };
    post();
    const timer = setInterval(post, CLIENT_METRICS_POST_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const lastRecoveryKey = useRef<string | null>(null);
  useEffect(() => {
    const obs = currentConditions?.observationID ?? "";
    const fetchedAt = currentConditions?.fetchedAt ?? "";
    const key = `${obs}|${fetchedAt}`;
    if (lastRecoveryKey.current !== null && key === lastRecoveryKey.current) return;
    lastRecoveryKey.current = key;
    refetchAllFeedsForFreshness();
  }, [currentConditions?.observationID, currentConditions?.fetchedAt, refetchAllFeedsForFreshness]);

  /**
   * Do not render the rotator until we have init + at least one SSE payload.
   * `useAlerts` defaults `alerts` to `[]`, which is truthy — that used to skip this gate after the first
   * successful (possibly empty) alerts response while init/SSE were still failing, yielding an empty
   * display on a dark blue background.
   */
  if (!config) {
    return <>{initAttempted ? "Channel offline" : "Connecting…"}</>;
  }
  if (isE2eAirportMetarFixture()) {
    return <E2eAirportMetarChannel config={config} />;
  }
  if (!currentConditions) {
    return <>Connecting…</>;
  }

  const retro = config?.gfx?.retro;
  const vhsAnalogOn = rwcBool(retro?.vhsAnalogLayerEnabled);
  const scanlinesOn = !!(retro?.scanlinesOpacity && retro.scanlinesOpacity > 0.001);
  const vhsTearOn = vhsAnalogOn && rwcBool(retro?.vhsHeadSwitchTearEnabled);

  return (
    <>
      <GfxRetroApply gfx={config?.gfx} useOfficialFonts={config?.config.useOfficialFonts ?? true} />
      <FontModeApply useOfficialFonts={config?.config.useOfficialFonts ?? true} />
      <div className="rwc-channel-stack">
        <div className="rwc-channel-frame">
          <NextGenGfxLayer enabled={!!config?.gfx?.features?.nextGenVisualLayersEnabled} />
          <CrawlerMessages crawler={config?.crawler} />
          <ScreenRotator
            screens={config?.flavour?.screens}
            weatherStationResponse={currentConditions}
            alerts={alertsHook}
            nationalWeather={nationalWeather}
            provinceTracking={provinceTracking}
            season={season}
            hotColdSpots={hotColdSpots}
            lastMonth={lastMonth}
            lastMonthFetchAttempted={lastMonthFetchAttempted}
            usaWeather={usaWeather}
            airportMetar={airportMetar ?? []}
            sunspotsPayload={sunspots}
            sunspotsFetchAttempted={sunspotsFetchAttempted}
            airQuality={airQuality}
            configVersion={config?.config.configVersion}
            reloadLineMs={config?.gfx?.retro?.reloadLineMs}
            authenticRefresh={config?.authenticRefresh}
            gfxFeatures={config?.gfx?.features}
            infoScreenLines={config?.infoScreen}
          />
          <FooterBar
            timeOffset={currentConditions?.stationTime?.stationOffsetMinutesFromLocal ?? 0}
            showFooterFreshnessHint={config?.config.showFooterFreshnessHint ?? true}
            snapshotFreshnessIsos={[
              currentConditions?.fetchedAt,
              nationalDataFetchedAt,
              provinceDataFetchedAt,
              alertsHook.alertsDataFetchedAt,
              airQualityDataFetchedAt,
              // Omit: USA (non-ECCC), season/last-month (server-computed cadence), sunspots (5m poll vs hourly ECCC),
              // hot/cold (6h server poll) — they should not drive “ECCC snapshot” wording.
            ]}
          />
        </div>
        <div className="gfx-vignette-layer" aria-hidden />
        <GfxVhsAnalogGrainLayer enabled={vhsAnalogOn} />
        <VhsHeadSwitchTearLayer enabled={vhsTearOn} />
        <GfxScanlinesLayer enabled={scanlinesOn} />
      </div>
      <PlaylistComponent playlist={config?.music} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("weather_channel") as HTMLElement);
root &&
  root.render(
    <React.StrictMode>
      <WeatherChannel />
    </React.StrictMode>
  );
