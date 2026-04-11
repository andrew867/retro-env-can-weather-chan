/**
 * Pluggable display-label rules (outlook area line, AQHI headline city, conditions template).
 * Core UI calls the registry only; regional / “retro cable” copy lives in separate bundles.
 */
export type DisplayLabelStationContext = {
  stationID: string;
  city: string | undefined;
};

/** Hooks CSS / layout presets on `#conditions` without branching in the component. */
export type ConditionsLabelTemplateId = "generic" | "eccc-retro-winnipeg" | "eccc-retro-southern-ontario";

export type OutlookAreaLabelRule = {
  /** Stable id for logging / future config references. */
  id: string;
  /** Higher runs first. */
  priority: number;
  applies: (ctx: DisplayLabelStationContext) => boolean;
  /** Fragment after “Outlook for …” (historically lowercase regional phrasing). */
  getFragment: (ctx: DisplayLabelStationContext) => string;
};

export type AqhiHeadlineCityRule = {
  id: string;
  priority: number;
  applies: (ctx: DisplayLabelStationContext) => boolean;
  /** Short city token on the “… air quality health index at” line (plate width). */
  getShortCity: (ctx: DisplayLabelStationContext) => string;
};

export type ConditionsLabelTemplateRule = {
  id: string;
  priority: number;
  applies: (ctx: DisplayLabelStationContext) => boolean;
  getTemplateId: (ctx: DisplayLabelStationContext) => ConditionsLabelTemplateId;
};

export type DisplayLabelBundle = {
  /** Bundle name (e.g. file slug) for diagnostics. */
  bundleId: string;
  outlookAreaRules: readonly OutlookAreaLabelRule[];
  aqhiHeadlineRules: readonly AqhiHeadlineCityRule[];
  conditionsTemplateRules: readonly ConditionsLabelTemplateRule[];
};
