export type NationalStationConfig = {
  name: string;
  code: string;
  isBackup?: boolean;
};

export type NationalStationObservation = {
  name: string;
  code: string;
  temperature: number | null;
  condition: string | null;
  abbreviatedCondition?: string;
  conditionUUID?: string;
  /** Airport METAR screen: 4-char padded flight category from AWC `fltCat` (e.g. `vfr `). */
  metarFltCatPadded?: string;
};

export type NationalStationObservations = NationalStationObservation[];

export type NationalWeather = {
  mb: NationalStationObservations;
  on: NationalStationObservations;
  east: NationalStationObservations;
  west: NationalStationObservations;
};
