import { Screens } from "consts";

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
   * Dwell time in seconds. For Forecast, Outlook, and Alerts, this is **per page** (each split slide);
   * approximate total for that playlist row ≈ page count × duration.
   */
  duration: number;
};

export type Flavours = Flavour[];

export type FlavourNames = string[];
