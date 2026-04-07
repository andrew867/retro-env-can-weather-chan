import axios from "lib/axios";
import { useCallback, useEffect, useState } from "react";
import { LastMonth } from "types";

const FETCH_LAST_MONTH_INTERVAL_MS = 15 * 60 * 1000;

export function useLastMonth() {
  const [lastMonth, setLastMonth] = useState<LastMonth>();

  const fetchLastMonth = useCallback(() => {
    axios
      .get("season/lastmonth")
      .then((resp) => {
        const { data } = resp;
        if (!data) return;

        setLastMonth(data);
      })
      .catch();
  }, []);

  useEffect(() => {
    fetchLastMonth();
    const id = setInterval(fetchLastMonth, FETCH_LAST_MONTH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchLastMonth]);

  return { lastMonth, fetchLastMonth };
}
