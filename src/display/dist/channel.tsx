import { CrawlerMessages } from "display/components/crawler";
import { FooterBar } from "display/components/footerbar";
import { GfxRetroApply } from "display/components/gfxRetroApply";
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
import React, { useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

function WeatherChannel() {
  const { config, refetchConfig } = useConfig();
  const { nationalWeather, nationalDataFetchedAt, fetchNationalWeather } = useNationalWeather();
  const { provinceTracking, provinceDataFetchedAt, refetchProvinceTracking } = useProvinceTracking();
  const { season, seasonDataFetchedAt, fetchSeason } = useSeason();
  const { hotColdSpots, hotColdDataFetchedAt, refetchHotColdSpots } = useCanadaHotColdSpots();
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

  const lastRecoveryKey = useRef<string | null>(null);
  useEffect(() => {
    const obs = currentConditions?.observationID ?? "";
    const fetchedAt = currentConditions?.fetchedAt ?? "";
    const key = `${obs}|${fetchedAt}`;
    if (lastRecoveryKey.current !== null && key === lastRecoveryKey.current) return;
    lastRecoveryKey.current = key;
    refetchAllFeedsForFreshness();
  }, [currentConditions?.observationID, currentConditions?.fetchedAt, refetchAllFeedsForFreshness]);

  if (
    !config &&
    !currentConditions &&
    !alertsHook.alerts &&
    !nationalWeather &&
    !provinceTracking &&
    !season &&
    !hotColdSpots &&
    !lastMonth &&
    !usaWeather &&
    !sunspots
  )
    return <>Channel offline</>;

  return (
    <>
      <GfxRetroApply gfx={config?.gfx} />
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
      />
      <FooterBar
        timeOffset={currentConditions?.stationTime?.stationOffsetMinutesFromLocal ?? 0}
        snapshotFreshnessIsos={[
          currentConditions?.fetchedAt,
          nationalDataFetchedAt,
          usaDataFetchedAt,
          alertsHook.alertsDataFetchedAt,
          provinceDataFetchedAt,
          seasonDataFetchedAt,
          lastMonthDataFetchedAt,
          hotColdDataFetchedAt,
          sunspotsDataFetchedAt,
          airQualityDataFetchedAt,
        ]}
      />
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
