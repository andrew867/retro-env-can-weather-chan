import { EVENT_BUS_CONFIG_CHANGE_AIR_QUALITY_STATION } from "consts";
import axios from "lib/backendAxios";
import { initializeConfig } from "lib/config";
import eventbus from "lib/eventbus";
import Logger from "lib/logger";
import { AQHIObservation } from "types";
import { ElementCompact, xml2js } from "xml-js";

const config = initializeConfig();
const logger = new Logger("AQHI");
const AIR_QUALITY_FETCH_INTERVAL = 10 * 60 * 1000;

class AirQuality {
  private _apiURL = "";
  private _aqhiObservation: AQHIObservation = null;
  private _fetchedAt: string | null = null;

  constructor() {
    this.initialize();
    setInterval(() => this.fetchAirQuality(), AIR_QUALITY_FETCH_INTERVAL);
    eventbus.addListener(EVENT_BUS_CONFIG_CHANGE_AIR_QUALITY_STATION, () => this.initialize());
  }

  private initialize() {
    if (!config) return;

    const raw = config.airQualityStation?.trim() ?? "";
    if (!raw) {
      this._apiURL = "";
      this.clearAirQualityObservation();
      return;
    }

    const [area, stationCode] = raw.split("/").map((s) => s.trim());
    if (!area || !stationCode) {
      logger.error("Invalid airQualityStation (expected area/stationCode)");
      this._apiURL = "";
      this.clearAirQualityObservation();
      return;
    }

    this._apiURL = `http://dd.weather.gc.ca/today/air_quality/aqhi/${area}/observation/realtime/xml/AQ_OBS_${stationCode}_CURRENT.xml`;
    logger.log("Air quality will be tracked");

    this.fetchAirQuality();
  }

  private fetchAirQuality() {
    const url = this._apiURL?.trim() ?? "";
    if (!url) {
      return;
    }

    logger.log("Fetching latest AQHI observation");
    // clear the observation incase data no longer exists on eccc
    this.clearAirQualityObservation();

    axios
      .get(url)
      .then((resp) => {
        const { data } = resp;
        if (!data) throw "Invalid response";

        // convert xml to js object
        const aqhiObservationXML: ElementCompact = xml2js(data, { compact: true });
        if (!aqhiObservationXML) return;

        // drill down into it to get the data we're after
        const conditionAirQuality: ElementCompact = aqhiObservationXML["conditionAirQuality"];
        if (!conditionAirQuality) return;

        const dateStamp: ElementCompact | undefined = conditionAirQuality["dateStamp"];
        if (!dateStamp) {
          this._aqhiObservation = { day: null, month: null, hour: null, isPM: false, value: null };
          return;
        }

        this._aqhiObservation = { day: null, month: null, hour: null, isPM: false, value: null };

        this._aqhiObservation.day = Number(dateStamp["day"]?._text);
        this._aqhiObservation.month = Number(dateStamp["month"]?._text);

        const hour: ElementCompact = dateStamp["hour"];
        this._aqhiObservation.hour = Number(hour?._text);
        this._aqhiObservation.isPM = hour?._attributes?.ampm === "PM";

        const aqhiNode: ElementCompact | undefined = conditionAirQuality["airQualityHealthIndex"];
        this._aqhiObservation.value =
          aqhiNode?._text != null && aqhiNode._text !== "" ? Number(aqhiNode._text) : null;

        logger.log("AQHI observation updated");
      })
      .catch((e) => {
        logger.error("Failed to fetch AQHI observation", e);
      });
  }

  private clearAirQualityObservation() {
    this._aqhiObservation = null;
  }

  public get observation() {
    return this._aqhiObservation;
  }

  public getLastFetchIso(): string | null {
    return this._fetchedAt;
  }
}

let airQuality: AirQuality = null;
export function initializeAirQuality(): AirQuality {
  if (process.env.NODE_ENV === "test") return new AirQuality();
  if (airQuality) return airQuality;

  airQuality = new AirQuality();
  return airQuality;
}
