import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AQHIObservationResponse, CAPObject, WeatherStation, AuthenticRefreshConfig } from "types";
import { AutomaticScreenProps } from "types/screen.types";
import { Conditions } from "../weather";
import { clampReloadLineMs, SCREEN_DEFAULT_DISPLAY_LENGTH, SCREEN_MIN_DISPLAY_LENGTH } from "consts";
import { cleanupAlertHeadline, shouldAlertFlash } from "lib/cap-cp";
import { computeStepDelayMs, isStreamablePlaintext, segmentGraphemes } from "lib/display/authenticRefreshScheduler";
import { immediateLinesFirstPage } from "lib/display/forecastScreenBodies";

type ForecastScreenProps = {
  weatherStationResponse: WeatherStation;
  /** Precomputed 8×32 pages from `buildForecastScreenBodies` / channel playlist. */
  forecastBodies: readonly string[];
  /** Which forecast page this rotator step shows (`0` = conditions + first page). */
  forecastPageIndex: number;
  alert?: CAPObject;
  isReload?: boolean;
  airQuality: AQHIObservationResponse;
  reloadLineMs?: number;
  authenticRefresh?: AuthenticRefreshConfig;
  /** Master switch from `gfx.features.authenticRefreshEnabled` (init); tuning lives in `authenticRefresh`. */
  authenticRefreshEnabled?: boolean;
  configVersion?: string;
  /** From flavour: seconds each forecast page stays on screen (incl. cont.. pages). */
  secondsPerPage?: number;
} & AutomaticScreenProps;

export function ForecastScreen(props: ForecastScreenProps) {
  const {
    onComplete,
    weatherStationResponse,
    forecastBodies,
    forecastPageIndex,
    alert,
    isReload,
    airQuality,
    reloadLineMs,
    authenticRefresh,
    authenticRefreshEnabled,
    configVersion,
    secondsPerPage,
  } = props ?? {};
  const dwellSec =
    secondsPerPage != null && secondsPerPage >= SCREEN_MIN_DISPLAY_LENGTH
      ? secondsPerPage
      : SCREEN_DEFAULT_DISPLAY_LENGTH;
  const pageChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useStableOnCompleteRef(onComplete);

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
    return () => {
      pageChangeTimeout.current && clearTimeout(pageChangeTimeout.current);
    };
  }, []);

  const formatAlertHeadline = (headline: string) => {
    const noInEffect = cleanupAlertHeadline(headline ?? "");
    const truncated = noInEffect
      .replace(/severe thunderstorm/gi, "severe tstorm")
      .replace(/statement/gi, "stmnt")
      .replace(/air quality/gi, "air qlty");
    return truncated;
  };

  const firstScreenForecastText = forecastBodies[0] ?? "";
  const continuationBodyText = forecastBodies[forecastPageIndex] ?? "";

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
    forecastPageIndex === 0;

  const useAuthenticContinuation =
    authenticFeatureOn &&
    !motionBlocked &&
    !isConfigOnlyReload &&
    forecastPageIndex > 0 &&
    authenticRefresh?.continuationGraphemeReveal !== false &&
    isStreamablePlaintext(continuationBodyText) &&
    continuationBodyText.trim().length > 0;

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
  const contGraphemes = useMemo(() => segmentGraphemes(continuationBodyText), [continuationBodyText]);
  const graphemesRef = useRef(graphemes);
  graphemesRef.current = graphemes;
  const contGraphemesRef = useRef(contGraphemes);
  contGraphemesRef.current = contGraphemes;

  /** Start `idle` (not `done`) so we never schedule the inter-page timer on the first paint while authentic reload is active. */
  const [authenticPhase, setAuthenticPhase] = useState<"idle" | "streaming" | "done">("idle");
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
    setAuthenticPhase("streaming");
    const len = graphemesRef.current.length;
    setStreamIndex(len > 0 ? 1 : 0);
  }, [revealedStep, useAuthenticForecast, isReload, forecastStreamTriggerStep]);

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

  const [contPhase, setContPhase] = useState<"idle" | "streaming" | "done">("idle");
  const [contStreamIndex, setContStreamIndex] = useState(0);

  useLayoutEffect(() => {
    if (forecastPageIndex === 0) {
      setContPhase("done");
      setContStreamIndex(0);
      return;
    }
    if (!useAuthenticContinuation) {
      setContPhase("done");
      setContStreamIndex(contGraphemes.length);
      return;
    }
    setContPhase("idle");
    setContStreamIndex(0);
  }, [forecastPageIndex, weatherStationResponse?.observationID, useAuthenticContinuation, contGraphemes.length]);

  /** If reload steps never reach the stream trigger (edge case), do not block pagination forever. */
  useEffect(() => {
    if (!useAuthenticForecast || !isReload || isConfigOnlyReload) return;
    if (authenticPhase !== "idle") return;
    const ms = clampReloadLineMs(reloadLineMs);
    const fallbackMs = Math.max(15_000, (maxReloadSteps + 3) * (ms + 25));
    const t = setTimeout(() => {
      setAuthenticPhase((p) => (p === "idle" ? "done" : p));
      setStreamIndex(graphemesRef.current.length);
    }, fallbackMs);
    return () => clearTimeout(t);
  }, [
    useAuthenticForecast,
    isReload,
    isConfigOnlyReload,
    authenticPhase,
    maxReloadSteps,
    reloadLineMs,
  ]);

  useEffect(() => {
    if (!useAuthenticContinuation || forecastPageIndex === 0) return;
    setContPhase("streaming");
    const len = contGraphemesRef.current.length;
    setContStreamIndex(len > 0 ? 1 : 0);
  }, [useAuthenticContinuation, forecastPageIndex, weatherStationResponse?.observationID, contGraphemes.length]);

  useEffect(() => {
    if (!useAuthenticContinuation || contPhase !== "streaming") return;
    if (contStreamIndex >= contGraphemes.length) {
      setContPhase("done");
      return;
    }
    const delay = computeStepDelayMs({
      charsPerSecond: authenticRefresh?.charsPerSecond,
      jitterMsPerCharMax: authenticRefresh?.jitterMsPerCharMax,
    });
    const t = setTimeout(() => {
      setContStreamIndex((i) => {
        const next = i + 1;
        if (next >= contGraphemes.length) setContPhase("done");
        return next;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [
    useAuthenticContinuation,
    contPhase,
    contStreamIndex,
    contGraphemes.length,
    authenticRefresh?.charsPerSecond,
    authenticRefresh?.jitterMsPerCharMax,
  ]);

  useEffect(() => {
    if (!useAuthenticContinuation || contPhase !== "idle") return;
    const t = setTimeout(() => {
      setContPhase((p) => (p === "idle" ? "done" : p));
      setContStreamIndex(contGraphemesRef.current.length);
    }, 15_000);
    return () => clearTimeout(t);
  }, [useAuthenticContinuation, contPhase]);

  const pageAdvanceBlocked =
    (forecastPageIndex === 0 && useAuthenticForecast && authenticPhase !== "done") ||
    (useAuthenticContinuation && contPhase !== "done");

  useEffect(() => {
    if (!weatherStationResponse || forecastBodies.length === 0) {
      const t = setTimeout(() => onCompleteRef.current(), 0);
      return () => clearTimeout(t);
    }

    if (pageAdvanceBlocked) {
      return;
    }

    const delaySec =
      forecastPageIndex === 0 && isReload && !useAuthenticForecast && forecastBodies.length === 1
        ? 0.05
        : dwellSec;

    const delayMs = delaySec * 1000;
    const t = setTimeout(() => {
      onCompleteRef.current();
    }, delayMs);
    pageChangeTimeout.current = t;
    return () => clearTimeout(t);
  }, [
    forecastPageIndex,
    isReload,
    forecastBodies.length,
    weatherStationResponse,
    pageAdvanceBlocked,
    useAuthenticForecast,
    dwellSec,
  ]);

  const effectiveReveal =
    !isReload || isConfigOnlyReload ? maxReloadStepsFull : revealedStep;

  const reloadVis = (step: number) => ({
    visibility: effectiveReveal >= step ? ("visible" as const) : ("hidden" as const),
  });

  const streamVisible = graphemes.slice(0, streamIndex).join("");
  const contStreamVisible = contGraphemes.slice(0, contStreamIndex).join("");

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

  const firstPageForecastBudget = immediateLinesFirstPage(!!alert);
  const forecastColumnClass =
    "forecast forecast-hardware-text-column" +
    (immediateForecastLines.length > 0 && immediateForecastLines.length < firstPageForecastBudget
      ? " forecast-hardware-text-column--top-balance"
      : "");

  if (!weatherStationResponse) return <></>;

  if (forecastBodies.length === 0) return <></>;

  return (
    <div id="forecast_screen" className={isReload ? "has-reloaded" : ""}>
      {forecastPageIndex === 0 && (
        <>
          <Conditions
            city={weatherStationResponse.city}
            conditions={weatherStationResponse.observed}
            stationTime={weatherStationResponse.stationTime}
            airQuality={airQuality}
            revealStep={effectiveReveal}
          />
          <div className={forecastColumnClass}>
            {alert && (
              <div
                className={`forecast-alert reload-animation ${shouldAlertFlash(alert) ? "flash" : ""}`}
                style={reloadVis(alertReloadStep)}
              >
                {formatAlertHeadline(alert.headline)}
              </div>
            )}
            {useAuthenticForecast ? (
              <div className="forecast-authentic-wrap">
                <pre className="authentic-forecast-stream">{streamVisible}</pre>
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
      {forecastPageIndex > 0 && forecastBodies[forecastPageIndex] != null && (
        <div className="forecast-continuation-screen">
          <div className="forecast-continuation-head">{weatherStationResponse.city} forecast cont..</div>
          <div className="forecast-continuation-body forecast-hardware-text-column">
            {useAuthenticContinuation ? (
              <div className="forecast-authentic-wrap">
                <pre className="authentic-forecast-stream">{contStreamVisible}</pre>
              </div>
            ) : (
              continuationLineNodes(forecastBodies[forecastPageIndex])
            )}
          </div>
        </div>
      )}
    </div>
  );
}
