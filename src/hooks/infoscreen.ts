import axios from "lib/axios";
import { useEffect, useState } from "react";
import { InfoScreenProps } from "types";

const FETCH_INFOSCREEN_INTERVAL = (60 * 1000) * 1;

// tell the channel to fetch the info screen data once every interval
export function useInfoScreenData() {
  const [messages, setInfoScreenMessages] = useState<InfoScreenProps["messages"]>([]);

  const fetchInfoScreenData = () => {
    axios
      .get("infoscreen/infoScreenData")
      .then((resp) => {
        const { data } = resp;
        if (!data) return;
        setInfoScreenMessages(data.messages);
      })
      .catch();
  };

  useEffect(() => {
    fetchInfoScreenData();
    setInterval(() => fetchInfoScreenData(), FETCH_INFOSCREEN_INTERVAL);
  }, []);

  const infoScreenData = { messages };

  return { infoScreenData };
}
