import { addMinutes, format } from "date-fns";
import { formatDisplayDate } from "lib/date";
import { isSnapshotStale } from "lib/display/dataFreshness";
import { useEffect, useRef, useState } from "react";

type FooterBarProps = {
  timeOffset: number;
  /** Any ISO timestamps from polled feeds; stale if the oldest relevant snapshot is too old. */
  snapshotFreshnessIsos?: (string | null | undefined)[];
};

export function FooterBar(props: FooterBarProps) {
  const { timeOffset, snapshotFreshnessIsos = [] } = props ?? {};
  const [time, setTime] = useState<Date>(new Date());
  const timerInterval = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    timerInterval.current = setInterval(() => {
      setTime(addMinutes(new Date(), timeOffset));
    }, 1000);

    return () => {
      timerInterval.current && clearInterval(timerInterval.current);
    };
  }, [timeOffset]);

  const formattedTime = format(time, "HH:mm:ss");
  const formattedDate = formatDisplayDate(time.getTime());

  const showStaleHint = snapshotFreshnessIsos.some((iso) => isSnapshotStale(iso));

  return (
    <div id="footer_bar">
      <div id="time_date">
        TIME {formattedTime}
        {"".padStart(5)}
        {formattedDate}
      </div>
      <div id="header">Environment Canada Weather</div>
      {showStaleHint ? <div id="data_stale_hint">ECCC snapshot may be outdated</div> : null}
    </div>
  );
}
