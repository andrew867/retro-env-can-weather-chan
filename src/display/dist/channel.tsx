import { CrawlerMessages } from "display/components/crawler";
import { FontModeApply } from "display/components/fontModeApply";
import { FooterBar } from "display/components/footerbar";
import { GfxRetroApply } from "display/components/gfxRetroApply";
import { NextGenGfxLayer } from "display/components/nextGenGfxLayer";
import { PlaylistComponent } from "display/components/playlist";
import { ScreenRotator } from "display/components/screenrotator";
import {
  useAlerts,
  useCanadaHotColdSpots,
  useLastMonth,
  useUSAWeather,
  useProvinceTracking,
  useSeason,
  useWeatherEventStream,
  useNationalWeather,
  useSunspots,
} from "hooks";
import { useAirQuality } from "hooks/airQuality";
import { useConfig } from "hooks/init";
import axios from "lib/axios";
import { getDisplayAxiosSnapshot } from "lib/displayUpstreamMetrics";
import { CLIENT_METRICS_POST_INTERVAL_MS } from "consts";
import React, { useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

function WeatherChannel() {
  const { config, refetchConfig, initAttempted } = useConfig();
  const { nationalWeather, nationalDataFetchedAt, fetchNationalWeather } = useNationalWeather();
  const { provinceTracking, provinceDataFetchedAt, refetchProvinceTracking } = useProvinceTracking();
  const { season, seasonDataFetchedAt, fetchSeason } = useSeason();
  const { hotColdSpots, refetchHotColdSpots } = useCanadaHotColdSpots();
  const { lastMonth, lastMonthDataFetchedAt, fetchLastMonth } = useLastMonth();
  const { usaWeather, usaDataFetchedAt, fetchUSAWeather } = useUSAWeather();
  const { sunspots, sunspotsDataFetchedAt, refetchSunspots } = useSunspots();
  const { airQuality, airQualityDataFetchedAt, refetchAirQuality } = useAirQuality();

  const alertsHook = useAlerts();

  /** After server recovery or SSE reconnect, refresh all polled feeds so `X-RWC-Data-Fetched-At` headers update immediately (footer stale hint). */
  const refetchAllFeedsForFreshness = useCallback(() => {
    fetchSeason();
    fetchLastMonth();
    fetchNationalWeather();
    fetchUSAWeather();
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
  if (!currentConditions) {
    return <>Connecting…</>;
  }

  return (
    <>
      <GfxRetroApply gfx={config?.gfx} useOfficialFonts={config?.config.useOfficialFonts ?? true} />
      <FontModeApply useOfficialFonts={config?.config.useOfficialFonts ?? true} />
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
          usaWeather={usaWeather}
          sunspots={sunspots}
          airQuality={airQuality}
          configVersion={config?.config.configVersion}
          reloadLineMs={config?.gfx?.retro?.reloadLineMs}
          authenticRefresh={config?.authenticRefresh}
          gfxFeatures={config?.gfx?.features}
        />
        <FooterBar
          timeOffset={currentConditions?.stationTime?.stationOffsetMinutesFromLocal ?? 0}
          showFooterFreshnessHint={config?.config.showFooterFreshnessHint ?? true}
          snapshotFreshnessIsos={[
            currentConditions?.fetchedAt,
            nationalDataFetchedAt,
            usaDataFetchedAt,
            alertsHook.alertsDataFetchedAt,
            provinceDataFetchedAt,
            seasonDataFetchedAt,
            lastMonthDataFetchedAt,
            // Hot/cold polls every 30m; stale hint threshold is 25m — would false-positive.
            sunspotsDataFetchedAt,
            airQualityDataFetchedAt,
          ]}
        />
      </div>
      <div className="gfx-vignette-layer" aria-hidden />
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
