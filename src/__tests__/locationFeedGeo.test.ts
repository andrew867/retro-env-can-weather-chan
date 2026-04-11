import { haversineKm } from "lib/eccc/locationFeedGeo";

describe("locationFeedGeo", () => {
  it("haversineKm returns small distance for nearby points", () => {
    const a = { lat: 43.6532, long: -79.3832 };
    const b = { lat: 43.7, long: -79.4 };
    const km = haversineKm(a, b);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(12);
  });
});
