import { AxiosError } from "axios";
import {
  formatAwcMetarConditionLine,
  parseAwcMetarRow,
  shouldTryAwcAfterNwsFailure,
} from "lib/usaweather/awcMetar";

function axiosErr(status: number): AxiosError {
  const e = new AxiosError(`HTTP ${status}`, String(status), undefined, undefined, {
    status,
    statusText: status === 503 ? "Service Unavailable" : "Not Found",
    data: {},
    headers: {},
    config: {} as never,
  });
  return e;
}

describe("awcMetar", () => {
  it("shouldTryAwcAfterNwsFailure is true for 503", () => {
    expect(shouldTryAwcAfterNwsFailure(axiosErr(503))).toBe(true);
  });

  it("shouldTryAwcAfterNwsFailure is false for 404", () => {
    expect(shouldTryAwcAfterNwsFailure(axiosErr(404))).toBe(false);
  });

  it("parseAwcMetarRow maps temp and condition", () => {
    const p = parseAwcMetarRow({
      icaoId: "KTPA",
      temp: 18.3,
      reportTime: "2026-04-08T12:00:00.000Z",
      fltCat: "VFR",
      cover: "OVC",
      wdir: 50,
      wspd: 6,
    });
    expect(p?.temperatureC).toBe(18.3);
    expect(p?.condition).toContain("VFR");
    expect(p?.conditionUUID.length).toBeGreaterThan(0);
  });

  it("formatAwcMetarConditionLine builds a short line", () => {
    expect(
      formatAwcMetarConditionLine({
        icaoId: "KXXX",
        fltCat: "MVFR",
        cover: "BKN",
        wdir: 270,
        wspd: 12,
      })
    ).toMatch(/MVFR/);
  });
});
