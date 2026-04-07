import axios from "lib/axios";
import { useEffect, useState } from "react";
import { AQHIObservationResponse } from "types";

// fetch air quality once every 15mins
const FETCH_AIR_QUALITY_INTERVAL = 60 * 1000 * 15;

export function useAirQuality() {
  const [airQuality, setAirQuality] = useState<AQHIObservationResponse | null>();

  const fetchAirQuality = () => {
    axios
      .get("airQuality")
      .then((resp) => {
        const { data }: { data: AQHIObservationResponse | null } = resp;
        if (data == null) {
          setAirQuality(null);
          return;
        }

        if (data.value == null || Number.isNaN(Number(data.value))) setAirQuality(null);
        else setAirQuality(data);
      })
      .catch();
  };

  useEffect(() => {
    fetchAirQuality();
    const id = setInterval(() => fetchAirQuality(), FETCH_AIR_QUALITY_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { airQuality };
}
