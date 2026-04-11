/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";
import { Conditions } from "display/components/weather/conditions";
import type { AQHIObservationResponse, ObservedConditions, WeatherStationTimeData } from "types";

const stationTime: WeatherStationTimeData = {
  observedDateTime: "2023-08-04T18:00:00.000Z",
  stationOffsetMinutesFromLocal: 0,
  timezone: "EDT",
};

const observed: ObservedConditions = {
  condition: "Cloudy",
  abbreviatedCondition: "cloudy",
  temperature: { value: 10, units: "C" },
  pressure: { change: 0, tendency: "steady", value: 100, units: "kPa" },
  humidity: { value: 50, units: "%" },
  visibility: { value: 10, units: "km" },
  wind: { speed: { value: 10, units: "km/h" }, gust: { value: 0, units: "km/h" }, direction: "N" },
  windchill: null,
};

const aq: AQHIObservationResponse = {} as AQHIObservationResponse;

describe("Conditions title (B-001 / D4)", () => {
  it("renders the full city name from MSC without truncation", () => {
    const { container } = render(
      <Conditions
        city="St. John's"
        conditions={observed}
        stationTime={stationTime}
        airQuality={aq}
        revealStep={99}
      />
    );
    expect(container.textContent).toContain("St. John's");
  });
});
