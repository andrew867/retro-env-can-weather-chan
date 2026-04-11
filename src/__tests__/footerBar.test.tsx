/** @jest-environment jsdom */

import { render } from "@testing-library/react";
import * as React from "react";
import { FooterBar } from "display/components/footerbar";

describe("FooterBar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("does not throw when time offset is NaN (nullish coalescing does not replace NaN)", () => {
    const { unmount } = render(<FooterBar timeOffset={Number.NaN} />);
    expect(() => jest.advanceTimersByTime(1500)).not.toThrow();
    unmount();
  });
});
