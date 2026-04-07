import { Flavour, FlavourNames } from "./flavour.types";
import type { AuthenticRefreshConfig } from "./authenticRefresh.types";
import type { GfxRuntimeConfig } from "./gfx.types";
import { ProvinceStation } from "./provincetracking.types";

export type ConfigFields = {
  primaryLocation: PrimaryLocation;
  provinceHighLowEnabled?: boolean;
  historicalDataStationID?: number;
  climateNormals?: ClimateNormals;
  lookAndFeel?: LookAndFeel;
  misc?: MiscConfig;
  flavour: Flavour;
  flavours: FlavourNames;
  provinceStations: ProvinceStation[];
  airQualityStation: string;
  crawler: string[];
  music: string[];
  gfx?: GfxRuntimeConfig;
  /** Serial forecast reveal tuning; persisted with gfx POST or `rwc-config.json`. */
  authenticRefresh?: AuthenticRefreshConfig;
};

export type PrimaryLocation = {
  province: string;
  location: string;
  name: string;
};

export type ClimateNormals = {
  stationID: number;
  climateID: number;
  province: string;
};

export type LookAndFeel = {
  font: string;
  flavour: string;
  /** Footer hint when polled data may be stale (ECCC snapshot). Default true. */
  showFooterFreshnessHint: boolean;
  /**
   * Use ECWC/GWCV web fonts (recw). When false, legacy consolas + ws4000 crawler (pre-official-font era).
   * Default true so upstream typography fixes stay the default; turn off to compare with older builds.
   */
  useOfficialFonts: boolean;
};

export type MiscConfig = {
  rejectInHourConditionUpdates?: boolean;
  alternateRecordsSource?: string;
};

export type InitChannel = {
  config: {
    font: string;
    provinceHighLowEnabled: boolean;
    configVersion?: string;
    showFooterFreshnessHint: boolean;
    useOfficialFonts: boolean;
  };
  gfx?: GfxRuntimeConfig;
  /** Serial-style forecast reveal; top-level in init (not nested under gfx). */
  authenticRefresh?: AuthenticRefreshConfig;
  crawler: CrawlerMessages;
  flavour: Flavour;
  music: string[];
};

export type CrawlerMessages = string[];
