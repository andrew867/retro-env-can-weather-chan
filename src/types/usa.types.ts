export type USAStationConfig = {
  name: string;
  code: string;
  isBackup?: boolean;
};

export type USAStationObservation = {
  name: string;
  code: string;
  temperature: number | null;
  condition: string | null;
  abbreviatedCondition?: string;
  conditionUUID?: string;
  /** Airport METAR screen: padded flight category from AWC `fltCat`. */
  metarFltCatPadded?: string;
};

export type USAStationObservations = USAStationObservation[];
