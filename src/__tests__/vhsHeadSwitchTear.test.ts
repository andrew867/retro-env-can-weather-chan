/** @jest-environment jsdom */

import { act, render } from "@testing-library/react";
import * as React from "react";
import { VhsHeadSwitchTearLayer } from "display/components/vhsHeadSwitchTearLayer";
import { isE2eStaticVhsTear, smoothVhsTearOffset } from "lib/display/vhsHeadSwitchTear";

describe("vhsHeadSwitchTear", () => {
  it("isE2eStaticVhsTear is false without e2e query", () => {
    expect(isE2eStaticVhsTear()).toBe(false);
  });

  it("smooths toward target", () => {
    expect(smoothVhsTearOffset(0, 10, 0.5)).toBe(5);
    expect(smoothVhsTearOffset(5, 10, 0.5)).toBe(7.5);
  });

  it("clamps alpha to 0–1", () => {
    expect(smoothVhsTearOffset(0, 10, 2)).toBe(10);
    expect(smoothVhsTearOffset(10, 0, -1)).toBe(10);
  });

  it("returns 0 for non-finite inputs", () => {
    expect(smoothVhsTearOffset(NaN, 1, 0.5)).toBe(0);
    expect(smoothVhsTearOffset(0, NaN, 0.5)).toBe(0);
  });
});

describe("VhsHeadSwitchTearLayer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    const host = document.createElement("div");
    host.id = "weather_channel";
    document.body.appendChild(host);

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it("renders the band and drives --gfx-vhs-tear-x on #weather_channel when enabled", () => {
    jest.useFakeTimers();
    const host = document.getElementById("weather_channel") as HTMLElement;

    render(React.createElement(VhsHeadSwitchTearLayer, { enabled: true }));

    expect(document.querySelector(".gfx-vhs-head-switch-tear")).toBeTruthy();
    expect(document.querySelector(".gfx-vhs-head-switch-tear__band")).toBeTruthy();

    expect(host.style.getPropertyValue("--gfx-vhs-tear-x")).toMatch(/px$/);

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(host.style.getPropertyValue("--gfx-vhs-tear-x")).toMatch(/px$/);

    jest.useRealTimers();
  });

  it("does not render when disabled", () => {
    render(React.createElement(VhsHeadSwitchTearLayer, { enabled: false }));
    expect(document.querySelector(".gfx-vhs-head-switch-tear")).toBeNull();
  });
});
