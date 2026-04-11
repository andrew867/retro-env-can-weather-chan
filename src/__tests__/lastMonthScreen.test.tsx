/** @jest-environment jsdom */

import { render } from "@testing-library/react";
import * as React from "react";
import { LastMonthScreen } from "display/components/screens/lastmonth";
import type { LastMonth } from "types";

const normal = {
  temperature: { min: -10.1, max: 5.2, mean: -2.5 },
  precip: { amount: 40.0 },
};

describe("LastMonthScreen", () => {
  it("renders N/A for null numeric fields instead of throwing", () => {
    const lastMonth = {
      actual: {
        averageHigh: null,
        averageLow: 1.0,
        averageTemp: null,
        totalPrecip: 12.3,
        warmestDay: { day: 3, value: 4.0 },
        coldestDay: { day: null as unknown as number, value: null as unknown as number },
      },
      normal,
    } as unknown as LastMonth;

    const { container } = render(
      <LastMonthScreen
        city="Testville"
        lastMonth={lastMonth}
        lastMonthFetchAttempted
        onComplete={() => {}}
      />
    );
    expect(container.querySelector("#lastmonth_screen")).toBeTruthy();
    expect(container.textContent).toContain("N/A");
  });
});
