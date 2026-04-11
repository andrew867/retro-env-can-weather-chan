import { validateFlavourScreenIds, validateLoadedConfigJson } from "lib/config/configValidation";
import { Screens } from "consts";

describe("configValidation", () => {
  it("validateLoadedConfigJson warns on empty primaryLocation fields", () => {
    const issues = validateLoadedConfigJson({
      primaryLocation: { province: "", location: "" },
    });
    expect(issues.some((i) => i.message.includes("province"))).toBe(true);
  });

  it("validateFlavourScreenIds warns on out-of-range screen id", () => {
    const issues = validateFlavourScreenIds([{ id: Screens.CANADA_TEMP_CONDITIONS_ON + 99 }]);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("validateLoadedConfigJson warns on invalid misc.logLevel", () => {
    const issues = validateLoadedConfigJson({
      primaryLocation: { province: "MB", location: "s0000193" },
      misc: { logLevel: "chatty" },
    });
    expect(issues.some((i) => i.message.includes("misc.logLevel"))).toBe(true);
  });

  it("validateLoadedConfigJson warns on misc.ltceVirtualClimateId with odd characters", () => {
    const issues = validateLoadedConfigJson({
      primaryLocation: { province: "MB", location: "s0000193" },
      misc: { ltceVirtualClimateId: "bad id!" },
    });
    expect(issues.some((i) => i.message.includes("ltceVirtualClimateId"))).toBe(true);
  });
});
