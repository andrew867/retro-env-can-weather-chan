/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ProvinceTrackingScreen } from "display/components/screens/provincetracking";
import type { ProvinceTracking, WeatherStationTimeData } from "types";

const time: WeatherStationTimeData = {
  observedDateTime: "2026-04-10T10:00:00.000Z",
  stationOffsetMinutesFromLocal: -300,
  timezone: "CDT",
};

describe("ProvinceTrackingScreen", () => {
  it("keeps fixed-width name and temp columns before precip (8ch name, 10ch temp, 1 space gap)", () => {
    const tracking: ProvinceTracking = {
      tracking: [
        {
          station: { name: "Winnipeg", code: "MB/s0000192" },
          minTemp: -5,
          maxTemp: 2,
          displayTemp: -5,
          yesterdayPrecip: 0.1,
          yesterdayPrecipUnit: "mm",
        },
      ],
      isOvernight: true,
      yesterdayPrecipDate: "Apr 9",
    };
    render(
      <div id="weather_channel">
        <ProvinceTrackingScreen tracking={tracking} weatherStationTime={time} onComplete={() => {}} />
      </div>
    );
    const item = screen.getAllByRole("listitem")[0];
    expect(item?.textContent).toMatch(/^Winnipeg {8}-5 TRACE$/);
  });
});
