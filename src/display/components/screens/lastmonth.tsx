import { format, isValid, subMonths } from "date-fns";
import { useStableOnCompleteRef } from "lib/display/useStableOnCompleteRef";
import { useEffect } from "react";
import { LastMonth } from "types";
import { AutomaticScreenProps } from "types/screen.types";

type LastMonthScreenProps = {
  city?: string | null;
  lastMonth: LastMonth | undefined;
  lastMonthFetchAttempted: boolean;
} & AutomaticScreenProps;

export function LastMonthScreen(props: LastMonthScreenProps) {
  const { city, lastMonth, lastMonthFetchAttempted, onComplete } = props ?? {};
  const onCompleteRef = useStableOnCompleteRef(onComplete);

  useEffect(() => {
    if (!city?.length) {
      onCompleteRef.current();
      return;
    }
    if (!lastMonthFetchAttempted) return;
    if (!lastMonth?.actual || !lastMonth?.normal) onCompleteRef.current();
  }, [city, lastMonth, lastMonthFetchAttempted]);

  if (!city?.length || !lastMonth?.actual || !lastMonth?.normal) return <></>;

  const month = format(subMonths(new Date(), 1), "MMMM");
  const formatNumber = (value: number | null | undefined) =>
    value != null && Number.isFinite(Number(value)) ? Number(value).toFixed(1).padStart(5) : "N/A";
  const formatTemp = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(Number(value))) return "N/A";
    const n = Number(value);
    return `${(n > 0 ? "+" : "") + n.toFixed(1)}`.padStart(5);
  };
  const formatDayWithSuffix = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(Number(value))) return "N/A";
    const dayNum = Math.trunc(Number(value));
    const date = subMonths(new Date(), 1);
    date.setDate(dayNum);
    if (!isValid(date)) return "N/A";

    return format(date, "do").padStart(4);
  };

  return (
    <div id="lastmonth_screen" style={{ overflowWrap: "anywhere", whiteSpace: "normal" }}>
      <div>Weather Statistics for {month}</div>
      <div>
        &nbsp;{(city ?? "").trim()}&nbsp;This Year{"".padStart(2)}Normal
      </div>
      <div>
        {"Average High".padEnd(15)}
        {formatNumber(lastMonth.actual?.averageHigh)}
        {"".padStart(4)}
        {formatNumber(lastMonth.normal?.temperature.max)}
      </div>
      <div>
        {"Average Low".padEnd(15)}
        {formatNumber(lastMonth.actual?.averageLow)}
        {"".padStart(4)}
        {formatNumber(lastMonth.normal?.temperature.min)}
      </div>
      <div>
        {"Mean Temp".padEnd(15)}
        {formatNumber(lastMonth.actual?.averageTemp)}
        {"".padStart(4)}
        {formatNumber(lastMonth.normal?.temperature.mean)}
      </div>
      <div>
        {"Precip (MM)".padEnd(15)}
        {formatNumber(lastMonth.actual?.totalPrecip)}
        {"".padStart(4)}
        {formatNumber(lastMonth.normal?.precip.amount)}
      </div>
      {/* on the original channel this line mentioned where in records the precip amount came (1st, 3rd, 9th, etc.)*/}
      <div>
        {"Warmest Temp.".padEnd(14)}
        {formatTemp(lastMonth.actual?.warmestDay?.value)} on the {formatDayWithSuffix(lastMonth.actual?.warmestDay?.day)}
      </div>
      <div>
        {"Coldest Temp.".padEnd(14)}
        {formatTemp(lastMonth.actual?.coldestDay?.value)} on the {formatDayWithSuffix(lastMonth.actual?.coldestDay?.day)}
      </div>
    </div>
  );
}
