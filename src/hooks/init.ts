import axios from "lib/axios";
import { useEffect, useState } from "react";
import { InitChannel } from "types";

const FETCH_CONFIG_INTERVAL = 5 * 60 * 1000;

// tell the channel to fetch the config once every interval
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
    setInterval(() => fetchConfig(), FETCH_CONFIG_INTERVAL);
  }, []);

  return { config };
}
