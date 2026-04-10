/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { AirportMetarScreen } from "display/components/screens/airportMetar";
import type { NationalStationObservations, WeatherStationTimeData } from "types";

const time: WeatherStationTimeData = {
  observedDateTime: "2026-04-10T10:00:00.000Z",
  stationOffsetMinutesFromLocal: -300,
  timezone: "CDT",
};

describe("AirportMetarScreen", () => {
  it("keeps padded spaces between city name and temperature (preformatted line)", () => {
    const observations: NationalStationObservations = [
      {
        name: "Winnipeg",
        code: "CYWG",
        temperature: 0,
        condition: "x",
        abbreviatedCondition: "ovc · 9",
        metarFltCatPadded: "vfr ",
      },
    ];
    render(
      <div id="weather_channel">
        <AirportMetarScreen observations={observations} weatherStationTime={time} onComplete={() => {}} />
      </div>
    );
    const item = screen.getAllByRole("listitem")[0];
    expect(item?.textContent).toMatch(/Winnipeg\s{2,}0/);
    expect(item?.textContent).toMatch(/0\s+vfr/);
    expect(item?.textContent).toContain("·");
  });
});
