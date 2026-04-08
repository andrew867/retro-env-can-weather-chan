import { buildOutlookScreenBodies, type OutlookPlaylistPage } from "lib/display/outlookScreenBodies";
import { coerceStringLines } from "lib/display/safeData";
import { useMemo } from "react";
import { WeatherStation } from "types";

type OutlookScreenProps = {
  weatherStationResponse: WeatherStation | undefined;
  /** From the channel playlist (`outlook_page`); when omitted, builds pages locally (e.g. dev). */
  outlookBodies?: readonly OutlookPlaylistPage[];
  outlookPageIndex?: number;
};

export function OutlookScreen(props: OutlookScreenProps) {
  const { weatherStationResponse, outlookBodies, outlookPageIndex = 0 } = props ?? {};

  const pages = useMemo(() => {
    if (outlookBodies?.length) return outlookBodies;
    return buildOutlookScreenBodies(weatherStationResponse);
  }, [outlookBodies, weatherStationResponse]);

  const page = pages[outlookPageIndex] ?? pages[0];
  if (!page) return <></>;

  const bodyLines = coerceStringLines(page.bodyLines);

  return (
    <div id="outlook_screen">
      {page.title ? <div className="outlook-screen-title">{String(page.title ?? "")}</div> : null}
      <div className="forecast-hardware-text-column outlook-screen-body">
        {bodyLines.map((line, i) => (
          <div key={i} className="outlook-body-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
