import { Screens } from "consts";

/** Built-in starting points when creating a new flavour in config (see `generateNewFlavour`). */
export type FlavourCreationTemplateId = "on-air-cable" | "all-screens-fast";

export type Flavour = {
  name: string;
  uuid?: string;
  created: Date;
  modified: Date;
  screens: FlavourScreen[];
};

export type FlavourScreen = {
  id: Screens;
  /**
   * Dwell time in seconds. For Forecast and Alerts, this is **per page** (each split slide);
   * approximate total for that playlist row ≈ page count × duration.
   */
  duration: number;
  /**
   * For **Last month stats** screen only: if **true**, include that playlist step every station-local calendar day.
   * If **false** or omitted (default), include only on days **1–5** (original ECCC cable-style cadence).
   */
  lastMonthStatsShowAllMonth?: boolean;
};

export type Flavours = Flavour[];

export type FlavourNames = string[];
