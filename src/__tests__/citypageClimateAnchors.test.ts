import { getCitypageClimateAnchor, normalizeCitypageLocationCode } from "lib/config/citypageClimateAnchors";

describe("citypageClimateAnchors", () => {
  it("normalizes province-prefixed and plain citypage codes", () => {
    expect(normalizeCitypageLocationCode("ON/s0000458")).toBe("s0000458");
    expect(normalizeCitypageLocationCode("NL/s0000280")).toBe("s0000280");
    expect(normalizeCitypageLocationCode("S0000549")).toBe("s0000549");
  });

  it("returns verified Hamilton and Oakville bundles", () => {
    const ham = getCitypageClimateAnchor("s0000549");
    expect(ham).toMatchObject({
      ltceVirtualClimateId: "VSON77V",
      historicalDataStationID: 49908,
      climateNormalsClimateID: 6153194,
      climateNormalsStationID: 4932,
    });
    const oak = getCitypageClimateAnchor("ON/s0000367");
    expect(oak).toMatchObject({
      ltceVirtualClimateId: "VSON79V",
      historicalDataStationID: 7868,
      climateNormalsClimateID: 6158350,
      climateNormalsStationID: 5051,
    });
  });

  it("returns null for unknown citypage codes (no guessing)", () => {
    expect(getCitypageClimateAnchor("s0000999")).toBeNull();
  });
});
