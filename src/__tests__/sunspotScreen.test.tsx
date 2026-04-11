/** @jest-environment jsdom */

jest.mock("lib/date/season", () => ({ isSunSpotSeason: jest.fn(() => true) }));

import { render } from "@testing-library/react";
import * as React from "react";
import { SunspotScreen } from "display/components/screens/sunspots";
import type { SunspotsWeatherPayload, WeatherStationTimeData } from "types";

const stationTime: WeatherStationTimeData = {
  observedDateTime: "2026-03-10T18:00:00.000Z",
  stationOffsetMinutesFromLocal: -300,
  timezone: "EST",
};

describe("SunspotScreen", () => {
  it("shows F10.7/SFU header on the MSC/DRAO flux sub-plate", () => {
    const payload: SunspotsWeatherPayload = {
      observations: [],
      solarFlux: {
        fluxDate: "20260310",
        fluxTime: "1800",
        adjustedSfU: 120,
        observedSfU: 118,
        ursiSfU: 119,
      },
      solarCycleSwpc: { daily: null, monthlyObserved: null, monthlyPredicted: null },
    };
    const { container } = render(
      <SunspotScreen sunspotsPayload={payload} sunspotsFetchAttempted weatherStationTime={stationTime} onComplete={() => {}} />
    );
    expect(container.textContent).toContain("F10.7 CM FLUX (SFU)");
    expect(container.textContent).toContain("MSC/DRAO");
  });

  it("shows ISN/F10.7 header when SWPC cycle data is present", () => {
    const payload: SunspotsWeatherPayload = {
      observations: [],
      solarFlux: null,
      solarCycleSwpc: {
        daily: { obsDateIso: "2026-03-09T12:00:00.000Z", swpcSsn: 42 },
        monthlyObserved: null,
        monthlyPredicted: null,
      },
    };
    const { container } = render(
      <SunspotScreen sunspotsPayload={payload} sunspotsFetchAttempted weatherStationTime={stationTime} onComplete={() => {}} />
    );
    expect(container.textContent).toContain("NOAA SWPC CYCLE (ISN + F10.7)");
  });

  it("shows NWS tropical header above the city outlook table", () => {
    const payload: SunspotsWeatherPayload = {
      observations: [
        {
          name: "Honolulu",
          code: "HFO",
          forecast: "Sunny",
          abbreviatedForecast: "Sunny",
          highTemp: 28,
          lowTemp: 22,
        },
      ],
      solarFlux: null,
      solarCycleSwpc: { daily: null, monthlyObserved: null, monthlyPredicted: null },
    };
    const { container } = render(
      <SunspotScreen sunspotsPayload={payload} sunspotsFetchAttempted weatherStationTime={stationTime} onComplete={() => {}} />
    );
    expect(container.textContent).toContain("NWS TROPICAL SUNSPOT WX");
  });
});
