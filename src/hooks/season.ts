import axios from "lib/axios";
import { useCallback, useEffect, useState } from "react";
import { Season } from "types";

/** Season flags rarely change; still poll so a dead SSE stream does not strand this data. */
const FETCH_SEASON_INTERVAL_MS = 15 * 60 * 1000;

export function useSeason() {
  const [season, setSeason] = useState<Season>();

  const fetchSeason = useCallback(() => {
    axios
      .get("season")
      .then((resp) => {
        const { data } = resp;
        if (!data) return;

        setSeason(data);
      })
      .catch();
  }, []);

  useEffect(() => {
    fetchSeason();
    const id = setInterval(fetchSeason, FETCH_SEASON_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchSeason]);

  return { season, fetchSeason };
}
