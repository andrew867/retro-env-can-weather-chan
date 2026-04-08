import { format } from "date-fns";
import { getAQHIRisk, getAQHIWarningMessage } from "lib/airquality/utils";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect, useMemo } from "react";
import { AQHIObservationResponse, AutomaticScreenProps } from "types";

type AQHIWarningScreenProps = {
  city: string;
  airQuality: AQHIObservationResponse;
} & AutomaticScreenProps;

export function AQHIWarningScreen({ city, airQuality, onComplete }: AQHIWarningScreenProps) {
  const onCompleteRef = useStableOnCompleteRef(onComplete);
  const observedDateTime = useMemo(() => {
    if (!airQuality || airQuality.month == null || airQuality.day == null || airQuality.hour == null) return;

    const y = new Date().getFullYear();
    const hour24 = airQuality.hour + (airQuality.isPM ? 12 : 0);
    let dt = new Date(y, airQuality.month - 1, airQuality.day, hour24);
    if (dt.getTime() > Date.now()) dt = new Date(y - 1, airQuality.month - 1, airQuality.day, hour24);

    return format(dt, "hh aa MMM dd").replace(/0(\d)/g, " $1");
  }, [airQuality, airQuality?.day, airQuality?.month, airQuality?.hour, airQuality?.isPM]);

  useEffect(() => {
    if (!airQuality || !airQuality.value || !airQuality.showWarning) onCompleteRef.current();
  }, [airQuality, airQuality?.value, airQuality?.showWarning]);

  if (!airQuality?.value || !airQuality?.showWarning) return <></>;

  return (
    <div style={{ textAlign: "left" }}>
      <div>{city.slice(0, 3)} air quality health index at</div>
      <div>
        {observedDateTime} is {Math.round(airQuality.value).toString().padStart(2)}-{getAQHIRisk(airQuality.value)} risk
      </div>
      <div>{getAQHIWarningMessage(airQuality.value)}</div>
    </div>
  );
}
