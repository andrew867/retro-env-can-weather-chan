import { ElementCompact, xml2js } from "xml-js";
import { EVENT_BUS_CONFIG_CHANGE_PRIMARY_LOCATION } from "consts";
import { initializeConfig } from "lib/config";
import Logger from "lib/logger";
import axios from "lib/backendAxios";
import { axiosGetWithMscMirror, MSC_HPFX_ORIGIN } from "lib/eccc/mscHttpMirror";
import eventbus from "lib/eventbus";
import { ECCCHotColdSpotElement, HotColdSpot } from "types";

const logger = new Logger("Canada_Hot_Cold_Spots");
const config = initializeConfig();

const FETCH_CANADA_HOT_COLD_SPOT_INTERVAL = 60 * 1000 * 60 * 6;

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function findQualifier(
  element: ECCCHotColdSpotElement | undefined,
  qualifierName: string
): ECCCHotColdSpotElement | undefined {
  return asArray(element?.qualifier as ECCCHotColdSpotElement | ECCCHotColdSpotElement[] | undefined).find(
    (q) => q?._attributes?.name === qualifierName
  );
}

function applyHotColdFromElements(
  elements: ECCCHotColdSpotElement[],
  target: { hotSpot: HotColdSpot; coldSpot: HotColdSpot }
): void {
  const hotSpotLocationCanada = elements.find((e) => e?._attributes?.name === "hot_spot_location_canada");
  if (hotSpotLocationCanada) {
    const hotTemp = findQualifier(hotSpotLocationCanada, "hot_spot_temperature_canada");
    const hotProv = findQualifier(hotSpotLocationCanada, "province");
    const hotLocationName = hotSpotLocationCanada._attributes?.value ?? "";
    const hotLocationTempValue = hotTemp?._attributes?.value ?? "";
    const hotLocationProvinceValue = hotProv?._attributes?.uom ?? "";
    target.hotSpot = {
      name: hotLocationName,
      temperature: Number(hotLocationTempValue),
      province: hotLocationProvinceValue,
    };
  }

  const coldSpotLocationCanada = elements.find((e) => e?._attributes?.name === "cold_spot_location_canada");
  if (coldSpotLocationCanada) {
    const coldTemp = findQualifier(coldSpotLocationCanada, "cold_spot_temperature_canada");
    const coldProv = findQualifier(coldSpotLocationCanada, "province");
    const coldLocationName = coldSpotLocationCanada._attributes?.value ?? "";
    const coldLocationTempValue = coldTemp?._attributes?.value ?? "";
    const coldLocationProvinceValue = coldProv?._attributes?.uom ?? "";
    target.coldSpot = {
      name: coldLocationName,
      temperature: Number(coldLocationTempValue),
      province: coldLocationProvinceValue,
    };
  }
}

class CanadaProvincialHotColdSpots {
  public _hotColdSpots = {
    hotSpot: { name: null, temperature: null, province: null } as HotColdSpot,
    coldSpot: { name: null, temperature: null, province: null } as HotColdSpot,
  };
  private _lastUpdated: Date;
  private _apiURL = "";

  constructor() {
    this.fetchCanadaProvincialHotColdSpot();
    setInterval(() => this.fetchCanadaProvincialHotColdSpot(), FETCH_CANADA_HOT_COLD_SPOT_INTERVAL);
    eventbus.addListener(EVENT_BUS_CONFIG_CHANGE_PRIMARY_LOCATION, () => this.fetchCanadaProvincialHotColdSpot());
  }

  private fetchCanadaProvincialHotColdSpot() {
    const province = config?.primaryLocation?.province;
    if (!province) return;

    const currentDate = new Date();
    const date = `${currentDate.getUTCFullYear()}${(currentDate.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}${currentDate.getUTCDate().toString().padStart(2, "0")}`;

    this._apiURL = `${MSC_HPFX_ORIGIN}/today/observations/xml/${province.toUpperCase()}/today/today_${province.toLowerCase()}_${date}_e.xml`;

    logger.log("Updating canada/provincial hot/cold spots");
    axiosGetWithMscMirror(axios, this._apiURL)
      .then((resp) => {
        const data = resp.data;
        if (!data) return;

        const provinceTodayData: ElementCompact = xml2js(data, { compact: true });
        if (!provinceTodayData) return;

        const collection = provinceTodayData["om:ObservationCollection"];
        if (!collection) return;

        const memberList = asArray(collection["om:member"]);
        for (const member of memberList) {
          const hotColdSpotData = member?.["om:Observation"]?.["om:result"];
          if (!hotColdSpotData?.elements) continue;

          const elements = asArray(hotColdSpotData.elements.element) as ECCCHotColdSpotElement[];
          if (!elements.length) continue;

          applyHotColdFromElements(elements, this._hotColdSpots);
          this._lastUpdated = new Date();
          break;
        }
      })
      .catch((err) => logger.error("Unable to fetch canada/provincial hot/cold spots", err));
  }

  public hotColdSpots() {
    return {
      ...this._hotColdSpots,
      lastUpdated: this._lastUpdated?.toISOString(),
    };
  }

  public getLastFetchIso(): string | null {
    return this._lastUpdated?.toISOString() ?? null;
  }

  public requestOperatorRefresh(): void {
    this.fetchCanadaProvincialHotColdSpot();
  }
}

let canadaProvincialHotColdSpots: CanadaProvincialHotColdSpots | null = null;
export function initializeCanadaProvincialHotColdSpot(forceNewInstance: boolean = false) {
  if (!forceNewInstance && canadaProvincialHotColdSpots) return canadaProvincialHotColdSpots;

  canadaProvincialHotColdSpots = new CanadaProvincialHotColdSpots();
  return canadaProvincialHotColdSpots;
}
