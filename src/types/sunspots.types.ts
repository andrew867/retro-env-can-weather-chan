export type SunspotStationConfig = {
  name: string;
  code: string;
  x: number;
  y: number;
};

export type SunspotStationObservation = {
  name: string;
  code: string;
  forecast: string | null;
  abbreviatedForecast?: string;
  highTemp: number;
  lowTemp: number;
};

export type SunspotStationObservations = SunspotStationObservation[];

/** One row from MSC/DRAO `fluxtable.txt` (10.7 cm solar flux, SFU). */
export type SolarFluxLatest = {
  fluxDate: string;
  fluxTime: string;
  observedSfU: number;
  adjustedSfU: number;
  ursiSfU: number;
};

/** Last daily estimated international sunspot number from SWPC JSON. */
export type SolarCycleSwpcDaily = {
  obsDateIso: string;
  swpcSsn: number;
};

/** Latest complete monthly row from SWPC observed solar-cycle indices. */
export type SolarCycleSwpcMonthlyObserved = {
  timeTag: string;
  ssn: number;
  observedSwpcSsn: number;
  f107: number;
};

/** Monthly prediction from SWPC predicted solar-cycle JSON. */
export type SolarCycleSwpcMonthlyPredicted = {
  timeTag: string;
  predictedSsn: number;
  predictedF107: number;
};

export type SolarCycleSwpcData = {
  daily: SolarCycleSwpcDaily | null;
  monthlyObserved: SolarCycleSwpcMonthlyObserved | null;
  monthlyPredicted: SolarCycleSwpcMonthlyPredicted | null;
};

/** `GET /weather/sunspots` JSON: tropical outlooks, Canadian 10.7 cm flux, NOAA SWPC cycle indices. */
export type SunspotsWeatherPayload = {
  observations: SunspotStationObservations;
  solarFlux: SolarFluxLatest | null;
  solarCycleSwpc: SolarCycleSwpcData;
};
