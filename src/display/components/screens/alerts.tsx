import { SCREEN_DEFAULT_DISPLAY_LENGTH, SCREEN_MIN_DISPLAY_LENGTH } from "consts";
import {
  cleanupAlertHeadline,
  compactContinuationBannerHeadline,
  isWarningSevereThunderstormWatch,
  shouldAlertFlash,
} from "lib/cap-cp";
import { paginateAlertDescriptionToPages } from "lib/cap-cp/alertDescriptionPages";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useRef, useState } from "react";
import { CAPObject } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type AlertScreenProps = {
  alerts: CAPObject[];
  hasFetched: boolean;
  /** Flavour: seconds each alert page (incl. CAP continuation slides) stays on screen. */
  secondsPerPage?: number;
} & AutomaticScreenProps;

type FakeAlertScreen = {
  isSevereTStormExplanation?: boolean;
} & Partial<CAPObject>;

function SevereTStormExplanationScreen() {
  return (
    <div id="stw_explanation">
      <div>a severe thunderstorm watch is</div>
      <div>an alert of possible thndrstrms</div>
      <div>large hail, intense lightning,</div>
      <div>locally heavy rain or damaging</div>
      <div>winds in and close to the watch</div>
      <div>area. persons in and near these</div>
      <div>areas should be on the lookout</div>
      <div>for severe weather conditions</div>
    </div>
  );
}

export function AlertScreen(props: AlertScreenProps) {
  const { onComplete, alerts, hasFetched, secondsPerPage } = props ?? {};
  const dwellMs =
    (secondsPerPage != null && secondsPerPage >= SCREEN_MIN_DISPLAY_LENGTH
      ? secondsPerPage
      : SCREEN_DEFAULT_DISPLAY_LENGTH) * 1000;
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const [page, setPage] = useState(1);
  const [displayedAlert, setDisplayedAlert] = useState<FakeAlertScreen>();
  const [displayAlerts, setDisplayAlerts] = useState<FakeAlertScreen[]>([]);
  const pageChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // still waiting on alerts to be fetched
    if (!hasFetched) return;

    // no alerts so we're done with this screen
    if (!alerts?.length) onCompleteRef.current();
    else {
      const tempAlerts: FakeAlertScreen[] = [...alerts];
      const hasSevereTStormWatch = tempAlerts.findIndex((alert) => isWarningSevereThunderstormWatch(alert.headline));
      if (hasSevereTStormWatch > -1)
        tempAlerts.splice(hasSevereTStormWatch + 1, 0, { isSevereTStormExplanation: true });

      const expanded: FakeAlertScreen[] = [];
      for (const item of tempAlerts) {
        if ((item as FakeAlertScreen).isSevereTStormExplanation) {
          expanded.push(item);
          continue;
        }
        const cap = item as CAPObject;
        const pages = paginateAlertDescriptionToPages(cap.description ?? "");
        if (pages.length === 0) {
          expanded.push(cap);
        } else if (pages.length === 1) {
          expanded.push({ ...cap, description: pages[0] });
        } else {
          pages.forEach((body, i) => {
            expanded.push({
              ...cap,
              description: body,
              headline:
                i === 0 ? cap.headline : compactContinuationBannerHeadline(cap.headline ?? ""),
            });
          });
        }
      }
      setDisplayAlerts(expanded);
    }
  }, [alerts, hasFetched]);

  useEffect(() => {
    setPage(1);
  }, [displayAlerts]);

  // page changer — clear prior timeout on each dep change (same pattern as forecast pagination)
  useEffect(() => {
    if (!displayAlerts.length) return;

    setDisplayedAlert(displayAlerts[page - 1]);

    if (pageChangeTimeout.current) clearTimeout(pageChangeTimeout.current);
    pageChangeTimeout.current = setTimeout(() => {
      if (page < displayAlerts.length) setPage(page + 1);
      else onCompleteRef.current();
    }, dwellMs);

    return () => {
      if (pageChangeTimeout.current) clearTimeout(pageChangeTimeout.current);
    };
  }, [page, displayAlerts, dwellMs]);

  // display nothing if there's no alerts
  if (!displayAlerts?.length) return <></>;

  return (
    <div id="alert_screen" className={!displayedAlert?.isSevereTStormExplanation && "centre-align"}>
      {displayedAlert?.isSevereTStormExplanation && <SevereTStormExplanationScreen />}
      {displayedAlert && !displayedAlert.isSevereTStormExplanation && (
        <>
          <div className={shouldAlertFlash(displayedAlert as CAPObject) ? "flash" : ""}>
            {cleanupAlertHeadline(displayedAlert.headline)}
          </div>
          <div className="alert-description-body" style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
            {displayedAlert.description}
          </div>
        </>
      )}
    </div>
  );
}
