import axios from "lib/axios";
import { useEffect, useState } from "react";
import { InitChannel } from "types";

/** How often the display refetches crawler / flavour / playlist from `GET /api/v1/init`. */
const FETCH_CONFIG_INTERVAL = 5 * 1000;

export function useConfig() {
  const [config, setConfig] = useState<InitChannel>();

  const fetchConfig = () => {
    axios
      .get("init")
      .then((resp) => {
        const { data } = resp;
        if (!data) return;

        setConfig(data);
      })
      .catch();
  };

  useEffect(() => {
    fetchConfig();
    const id = setInterval(() => fetchConfig(), FETCH_CONFIG_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { config };
}
