import {
  formatProvinceYesterdayPrecipDisplay,
  PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY,
} from "lib/display/provinceYesterdayPrecipDisplay";

describe("formatProvinceYesterdayPrecipDisplay", () => {
  it("shows NIL for string NIL only (no detectable precip token)", () => {
    expect(formatProvinceYesterdayPrecipDisplay("NIL", "mm")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
    expect(formatProvinceYesterdayPrecipDisplay("nil", "mm")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
  });

  it("shows MISSING for N/A (not available, not the same as NIL)", () => {
    expect(formatProvinceYesterdayPrecipDisplay("N/A", "mm")).toBe("MISSING");
    expect(formatProvinceYesterdayPrecipDisplay("n/a", "mm")).toBe("MISSING");
  });

  it("shows TRACE only for explicit trace string", () => {
    expect(formatProvinceYesterdayPrecipDisplay("trace", "mm")).toBe("TRACE");
    expect(formatProvinceYesterdayPrecipDisplay("TRACE", "mm")).toBe("TRACE");
  });

  it("shows MISSING for M, empty, null, undefined", () => {
    expect(formatProvinceYesterdayPrecipDisplay("M", "mm")).toBe("MISSING");
    expect(formatProvinceYesterdayPrecipDisplay("missing", "mm")).toBe("MISSING");
    expect(formatProvinceYesterdayPrecipDisplay("", "mm")).toBe("MISSING");
    expect(formatProvinceYesterdayPrecipDisplay(null, "mm")).toBe("MISSING");
    expect(formatProvinceYesterdayPrecipDisplay(undefined, "mm")).toBe("MISSING");
  });

  it("maps sub-threshold liquid amounts to NIL (including zero)", () => {
    expect(formatProvinceYesterdayPrecipDisplay(0, "mm")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
    expect(formatProvinceYesterdayPrecipDisplay(0.1, "mm")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
    expect(formatProvinceYesterdayPrecipDisplay(0.199, "mm")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
  });

  it("shows measured liquid at or above 0.2 mm", () => {
    expect(formatProvinceYesterdayPrecipDisplay(0.2, "mm")).toMatch(/0\.2\s+MM/i);
    expect(formatProvinceYesterdayPrecipDisplay(2.4, "mm")).toMatch(/2\.4\s+MM/i);
  });

  it("maps sub-threshold snow amounts to NIL", () => {
    expect(formatProvinceYesterdayPrecipDisplay(0, "cm snow")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
    expect(formatProvinceYesterdayPrecipDisplay(0.04, "cm snow")).toBe(PROVINCE_YESTERDAY_PRECIP_NIL_DISPLAY);
  });

  it("shows measured snow at or above 0.05 cm", () => {
    expect(formatProvinceYesterdayPrecipDisplay(0.05, "cm snow")).toMatch(/0\.1\s+CM\s+SNOW/i);
    expect(formatProvinceYesterdayPrecipDisplay(4, "cm snow")).toMatch(/4\.0\s+CM\s+SNOW/i);
  });
});
