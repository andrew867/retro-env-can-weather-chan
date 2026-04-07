import { useEffect, useMemo, useRef, useState } from "react";
import { AQHIObservationResponse, CAPObject, WeatherStation, AuthenticRefreshConfig, Forecast } from "types";
import { AutomaticScreenProps } from "types/screen.types";
import { Conditions } from "../weather";
import { clampReloadLineMs, SCREEN_DEFAULT_DISPLAY_LENGTH } from "consts";
import { paginateText8x32 } from "lib/display";
import { shouldAlertFlash } from "lib/cap-cp";
import {
  clearStyleClass,
  computeStepDelayMs,
  isStreamablePlaintext,
  segmentGraphemes,
} from "lib/display/authenticRefreshScheduler";

type ForecastScreenProps = {
  weatherStationResponse: WeatherStation;
  alert?: CAPObject;
  isReload?: boolean;
  airQuality: AQHIObservationResponse;
  reloadLineMs?: number;
  authenticRefresh?: AuthenticRefreshConfig;
  /** Master switch from `gfx.features.authenticRefreshEnabled` (init); tuning lives in `authenticRefresh`. */
  authenticRefreshEnabled?: boolean;
  configVersion?: string;
} & AutomaticScreenProps;

/** Lines for immediate forecast under the conditions block (alert uses one forecast line). */
function immediateLinesFirstPage(hasAlert: boolean) {
  return hasAlert ? 3 : 4;
}

/** Continuation screens have no conditions — fit more lines of 32-col text. */
const FORECAST_CONTINUATION_LINES = 6;
/** Later periods (e.g. Alberta clipper) shown full-screen, paginated. */
const SUPPLEMENTARY_FORECAST_LINES = 6;

function appendForecastPages(bodies: string[], f: Forecast | undefined) {
  if (!f?.abbreviatedTextSummary?.trim()) return;
  const raw = `${f.period}..${f.abbreviatedTextSummary}`;
  bodies.push(...paginateText8x32(raw, SUPPLEMENTARY_FORECAST_LINES, SUPPLEMENTARY_FORECAST_LINES));
}

export function ForecastScreen(props: ForecastScreenProps) {
  const {
    onComplete,
    weatherStationResponse,
    alert,
    isReload,
    airQuality,
    reloadLineMs,
    authenticRefresh,
    authenticRefreshEnabled,
    configVersion,
  } = props ?? {};
  const [screenIx, setScreenIx] = useState(0);
  const pageChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [immediateForecast, page1Forecast1, page1Forecast2, page2Forecast1, page2Forecast2] =
    weatherStationResponse?.forecast ?? [];

  const screenBodies = useMemo(() => {
    const bodies: string[] = [];
    const hasAlert = !!alert;
    if (immediateForecast?.abbreviatedTextSummary?.trim()) {
      const raw = `Forecast for ${immediateForecast.period}..${immediateForecast.abbreviatedTextSummary}`;
      bodies.push(
        ...paginateText8x32(raw, immediateLinesFirstPage(hasAlert), FORECAST_CONTINUATION_LINES)
      );
    }
    appendForecastPages(bodies, page1Forecast1);
    appendForecastPages(bodies, page1Forecast2);
    appendForecastPages(bodies, page2Forecast1);
    appendForecastPages(bodies, page2Forecast2);
    return bodies;
  }, [
    alert,
    immediateForecast?.period,
    immediateForecast?.abbreviatedTextSummary,
    page1Forecast1?.period,
    page1Forecast1?.abbreviatedTextSummary,
    page1Forecast2?.period,
    page1Forecast2?.abbreviatedTextSummary,
    page2Forecast1?.period,
    page2Forecast1?.abbreviatedTextSummary,
    page2Forecast2?.period,
    page2Forecast2?.abbreviatedTextSummary,
  ]);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setPrefersReducedMotion(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!weatherStationResponse || screenBodies.length === 0) {
      const t = setTimeout(() => onCompleteRef.current(), 0);
      return () => clearTimeout(t);
    }

    const delayMs = (screenIx === 0 && isReload ? 50 : SCREEN_DEFAULT_DISPLAY_LENGTH) * 1000;
    const t = setTimeout(() => {
      if (screenIx < screenBodies.length - 1) setScreenIx(screenIx + 1);
      else onCompleteRef.current();
    }, delayMs);
    pageChangeTimeout.current = t;
    return () => clearTimeout(t);
  }, [screenIx, isReload, screenBodies.length, weatherStationResponse]);

  useEffect(() => {
    setScreenIx(0);
  }, [weatherStationResponse?.observationID]);

  useEffect(() => {
    return () => {
      pageChangeTimeout.current && clearTimeout(pageChangeTimeout.current);
    };
  }, []);

  const formatAlertHeadline = (headline: string) => {
    const truncated = headline
      ?.replace(/severe thunderstorm/gi, "severe tstorm")
      .replace(/statement/gi, "stmnt")
      .replace(/air quality/gi, "air qlty");
    return truncated;
  };

  const firstScreenForecastText = screenBodies[0] ?? "";

  const immediateForecastLines = useMemo(() => {
    if (!firstScreenForecastText.trim()) return [] as string[];
    return firstScreenForecastText
      .split(/\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);
  }, [firstScreenForecastText]);

  const alertReloadStep = 8;
  const forecastLineStartStep = alert ? alertReloadStep + 1 : alertReloadStep;

  const windchill = weatherStationResponse?.observed?.windchill ?? 0;
  const isShowingExtraData = windchill > 0 || airQuality?.value;
  const conditionsStepCount = 6 + (isShowingExtraData ? 1 : 0);

  const maxReloadStepsFull = useMemo(() => {
    if (immediateForecastLines.length > 0)
      return forecastLineStartStep + immediateForecastLines.length - 1;
    return alert ? alertReloadStep : conditionsStepCount;
  }, [immediateForecastLines.length, forecastLineStartStep, alert, conditionsStepCount]);

  const motionBlocked =
    !!authenticRefresh?.respectReducedMotion && prefersReducedMotion;

  const authenticFeatureOn = authenticRefreshEnabled !== false && !!authenticRefresh?.enabled;

  const authenticUse =
    authenticFeatureOn &&
    !motionBlocked &&
    isStreamablePlaintext(firstScreenForecastText) &&
    screenIx === 0;

  const prevObs = useRef<string | undefined>();
  const prevCfg = useRef<string | undefined>();
  const isConfigOnlyReload =
    !!isReload &&
    prevObs.current !== undefined &&
    prevObs.current === weatherStationResponse?.observationID &&
    prevCfg.current !== undefined &&
    prevCfg.current !== configVersion;

  useEffect(() => {
    prevObs.current = weatherStationResponse?.observationID;
    prevCfg.current = configVersion;
  }, [weatherStationResponse?.observationID, configVersion]);

  const maxReloadSteps = useMemo(() => {
    if (isConfigOnlyReload) return maxReloadStepsFull;
    if (authenticUse && immediateForecastLines.length > 0) return forecastLineStartStep - 1;
    return maxReloadStepsFull;
  }, [
    isConfigOnlyReload,
    authenticUse,
    immediateForecastLines.length,
    forecastLineStartStep,
    maxReloadStepsFull,
  ]);

  const [revealedStep, setRevealedStep] = useState(0);
  useEffect(() => {
    if (!isReload) return;
    if (isConfigOnlyReload) {
      setRevealedStep(maxReloadStepsFull);
      return;
    }
    setRevealedStep(0);
    const ms = clampReloadLineMs(reloadLineMs);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let s = 1; s <= maxReloadSteps; s++) {
      timers.push(
        setTimeout(() => {
          setRevealedStep(s);
        }, (s + 1) * ms)
      );
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isReload, isConfigOnlyReload, maxReloadSteps, maxReloadStepsFull, reloadLineMs, weatherStationResponse?.observationID]);

  const graphemes = useMemo(() => segmentGraphemes(firstScreenForecastText), [firstScreenForecastText]);

  const [authenticPhase, setAuthenticPhase] = useState<"idle" | "clearing" | "streaming" | "done">("done");
  const [streamIndex, setStreamIndex] = useState(0);

  const useAuthenticForecast =
    authenticUse && isReload && !isConfigOnlyReload && !motionBlocked && immediateForecastLines.length > 0;

  const forecastStreamTriggerStep = forecastLineStartStep - 1;

  useEffect(() => {
    if (!useAuthenticForecast) {
      setAuthenticPhase("done");
      setStreamIndex(graphemes.length);
      return;
    }
    setAuthenticPhase("idle");
    setStreamIndex(0);
  }, [weatherStationResponse?.observationID, useAuthenticForecast, graphemes.length]);

  useEffect(() => {
    if (!useAuthenticForecast || !isReload) return;
    if (revealedStep !== forecastStreamTriggerStep) return;
    setAuthenticPhase("clearing");
    const clearMs = Math.min(500, Math.max(0, authenticRefresh?.clearHoldMs ?? 120));
    const t = setTimeout(() => {
      setAuthenticPhase("streaming");
      setStreamIndex(graphemes.length > 0 ? 1 : 0);
    }, clearMs);
    return () => clearTimeout(t);
  }, [
    revealedStep,
    useAuthenticForecast,
    isReload,
    forecastStreamTriggerStep,
    authenticRefresh?.clearHoldMs,
    graphemes.length,
  ]);

  useEffect(() => {
    if (!useAuthenticForecast || authenticPhase !== "streaming") return;
    if (streamIndex >= graphemes.length) {
      setAuthenticPhase("done");
      return;
    }
    const delay = computeStepDelayMs({
      charsPerSecond: authenticRefresh?.charsPerSecond,
      jitterMsPerCharMax: authenticRefresh?.jitterMsPerCharMax,
    });
    const t = setTimeout(() => {
      setStreamIndex((i) => {
        const next = i + 1;
        if (next >= graphemes.length) setAuthenticPhase("done");
        return next;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [
    useAuthenticForecast,
    authenticPhase,
    streamIndex,
    graphemes.length,
    authenticRefresh?.charsPerSecond,
    authenticRefresh?.jitterMsPerCharMax,
  ]);

  const effectiveReveal =
    !isReload || isConfigOnlyReload ? maxReloadStepsFull : revealedStep;

  const reloadVis = (step: number) => ({
    visibility: effectiveReveal >= step ? ("visible" as const) : ("hidden" as const),
  });

  const streamVisible = graphemes.slice(0, streamIndex).join("");

  const continuationLineNodes = (body: string) =>
    body
      .split(/\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0)
      .map((line, ix) => (
        <div key={ix} className="reload-animation" style={{ visibility: "visible" }}>
          {line}
        </div>
      ));

  if (!weatherStationResponse) return <></>;

  if (screenBodies.length === 0) return <></>;

  return (
    <div id="forecast_screen" className={isReload ? "has-reloaded" : ""}>
      {screenIx === 0 && (
        <>
          <Conditions
            city={weatherStationResponse.city}
            conditions={weatherStationResponse.observed}
            stationTime={weatherStationResponse.stationTime}
            airQuality={airQuality}
            revealStep={effectiveReveal}
          />
          <div className="forecast">
            {alert && (
              <div
                className={`centre-align forecast-alert reload-animation ${
                  shouldAlertFlash(alert) ? "flash" : ""
                }`}
                style={reloadVis(alertReloadStep)}
              >
                {formatAlertHeadline(alert.headline)}
              </div>
            )}
            {useAuthenticForecast ? (
              <div className="forecast-authentic-wrap">
                {authenticPhase === "clearing" && (
                  <div
                    className={`authentic-clear ${clearStyleClass(authenticRefresh?.clearStyle)}`}
                    aria-hidden
                  />
                )}
                {(authenticPhase === "streaming" || authenticPhase === "done") && (
                  <pre className="authentic-forecast-stream">{streamVisible}</pre>
                )}
                {authenticPhase === "idle" && <div className="authentic-forecast-pending" aria-hidden />}
              </div>
            ) : (
              immediateForecastLines.map((line, ix) => (
                <div key={ix} className="reload-animation" style={reloadVis(forecastLineStartStep + ix)}>
                  {line}
                </div>
              ))
            )}
          </div>
        </>
      )}
      {screenIx > 0 && screenBodies[screenIx] != null && (
        <div>
          <div className="centre-align">{weatherStationResponse.city} forecast cont..</div>
          {continuationLineNodes(screenBodies[screenIx])}
        </div>
      )}
    </div>
  );
}
