import { addMinutes, format } from "date-fns";
import { formatDisplayDate } from "lib/date";
import { isSnapshotStale } from "lib/display/dataFreshness";
import { useEffect, useRef, useState } from "react";

function finiteFooterOffsetMinutes(m: number | undefined): number {
  return typeof m === "number" && Number.isFinite(m) ? m : 0;
}

type FooterBarProps = {
  timeOffset: number;
  /** ISO timestamps for ECCC-aligned feeds; stale if any is past `STALE_SNAPSHOT_THRESHOLD_MINUTES` (~hourly obs + jitter). */
  snapshotFreshnessIsos?: (string | null | undefined)[];
  /** When false, never show the bottom “snapshot may be outdated” line (Look and Feel). */
  showFooterFreshnessHint?: boolean;
};

export function FooterBar(props: FooterBarProps) {
  const { timeOffset, snapshotFreshnessIsos = [], showFooterFreshnessHint = true } = props ?? {};
  const safeOffset = finiteFooterOffsetMinutes(timeOffset);
  const [time, setTime] = useState<Date>(new Date());
  const timerInterval = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    timerInterval.current = setInterval(() => {
      setTime(addMinutes(new Date(), safeOffset));
    }, 1000);

    return () => {
      timerInterval.current && clearInterval(timerInterval.current);
    };
  }, [safeOffset]);

  const formattedTime = format(time, "HH:mm:ss");
  const formattedDate = formatDisplayDate(time.getTime());

  const showStaleHint =
    showFooterFreshnessHint && snapshotFreshnessIsos.some((iso) => isSnapshotStale(iso));

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
