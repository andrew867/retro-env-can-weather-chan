import { format } from "date-fns";
import { getAQHIRisk, getAQHIWarningMessage } from "lib/airquality/utils";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo } from "react";
import { AQHIObservationResponse, AutomaticScreenProps } from "types";

type AQHIWarningScreenProps = {
  city?: string | null;
  airQuality: AQHIObservationResponse | null;
} & AutomaticScreenProps;

export function AQHIWarningScreen({ city, airQuality, onComplete }: AQHIWarningScreenProps) {
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const cityLabel = (city ?? "").trim() || "Local";
  const observedDateTime = useMemo(() => {
    if (!airQuality || airQuality.month == null || airQuality.day == null || airQuality.hour == null) return;

    const y = new Date().getFullYear();
    const h = airQuality.hour;
    const hour24 = airQuality.isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    let dt = new Date(y, airQuality.month - 1, airQuality.day, hour24);
    if (dt.getTime() > Date.now()) dt = new Date(y - 1, airQuality.month - 1, airQuality.day, hour24);

    return format(dt, "hh aa MMM dd").replace(/0(\d)/g, " $1");
  }, [airQuality, airQuality?.day, airQuality?.month, airQuality?.hour, airQuality?.isPM]);

  useEffect(() => {
    const v = airQuality?.value != null ? Number(airQuality.value) : NaN;
    if (!airQuality || !Number.isFinite(v) || !airQuality.showWarning) onCompleteRef.current();
  }, [airQuality, airQuality?.value, airQuality?.showWarning]);

  const aqhiNum = airQuality?.value != null ? Number(airQuality.value) : NaN;
  if (!airQuality?.showWarning || !Number.isFinite(aqhiNum)) return <></>;

  return (
    <div id="aqhi_warning_screen" style={{ textAlign: "left", overflowWrap: "anywhere", whiteSpace: "normal" }}>
      <div>{cityLabel} air quality health index at</div>
      <div>
        {observedDateTime ?? "last report"} is {Math.round(aqhiNum).toString().padStart(2)}-{getAQHIRisk(aqhiNum)} risk
      </div>
      <div>{getAQHIWarningMessage(aqhiNum)}</div>
    </div>
  );
}
