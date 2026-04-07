export type AQHIObservationFields = {
  day: number | null;
  month: number | null;
  hour: number | null;
  isPM: boolean;
  value: number | null;
};

export type AQHIObservation = AQHIObservationFields | null;

export type AQHIObservationResponse = AQHIObservationFields & {
  textValue?: string;
  showWarning?: boolean;
};

export type AirQualityStation = {
  zone: string;
  code: string;
  name: string;
};

export type AirQualityStations = AirQualityStation[];
