/** @jest-environment jsdom */

import { render } from "@testing-library/react";
import * as React from "react";
import { AQHIWarningScreen } from "display/components/screens/aqhiwarning";

describe("AQHIWarningScreen", () => {
  it("renders without throwing when city is missing and AQHI is elevated", () => {
    const onComplete = jest.fn();
    const { container } = render(
      <AQHIWarningScreen
        city={undefined as unknown as string}
        airQuality={{
          day: 9,
          month: 4,
          hour: 2,
          isPM: false,
          value: 7,
          showWarning: true,
          textValue: "Poor",
        }}
        onComplete={onComplete}
      />
    );
    expect(container.querySelector("#aqhi_warning_screen")).toBeTruthy();
    expect(container.textContent).toContain("Local air quality");
  });
});
