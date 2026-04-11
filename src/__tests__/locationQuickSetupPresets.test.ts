import { getProvinceTrackingPresetForProvince } from "lib/config/locationQuickSetupPresets";
import { PROVINCE_TRACKING_DEFAULT_STATIONS } from "consts/provincetracking.consts";

describe("locationQuickSetupPresets", () => {
  it("returns Manitoba default list for MB", () => {
    const p = getProvinceTrackingPresetForProvince("MB");
    expect(p).not.toBeNull();
    expect(p!.length).toBe(PROVINCE_TRACKING_DEFAULT_STATIONS.length);
    expect(p![0]?.code).toMatch(/^MB\//);
  });

  it("returns six-city Ontario preset for ON", () => {
    const p = getProvinceTrackingPresetForProvince("ON");
    expect(p).not.toBeNull();
    expect(p!.map((s) => s.code)).toContain("ON/s0000458");
    expect(p!.length).toBe(6);
  });

  it("returns null for unsupported provinces", () => {
    expect(getProvinceTrackingPresetForProvince("QC")).toBeNull();
    expect(getProvinceTrackingPresetForProvince("")).toBeNull();
  });
});
