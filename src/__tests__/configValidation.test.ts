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
    const issues = validateFlavourScreenIds([{ id: Screens.AIRPORT_METAR + 99 }]);
    expect(issues.length).toBeGreaterThan(0);
  });
});
