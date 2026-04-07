import { mscMirrorTryOrder, normalizeMscHttpUrl } from "lib/eccc/mscHttpMirror";

describe("mscHttpMirror", () => {
  it("normalizes legacy http Datamart URLs to https", () => {
    expect(normalizeMscHttpUrl("http://dd.weather.gc.ca/today/foo")).toBe("https://dd.weather.gc.ca/today/foo");
  });

  it("orders HPFX first when given a Datamart URL", () => {
    const u = "https://dd.weather.gc.ca/today/citypage_weather/siteList.xml";
    expect(mscMirrorTryOrder(u)).toEqual([
      "https://hpfx.collab.science.gc.ca/today/citypage_weather/siteList.xml",
      u,
    ]);
  });

  it("orders Datamart second when given an HPFX URL", () => {
    const u = "https://hpfx.collab.science.gc.ca/today/air_quality/doc/x.xml";
    expect(mscMirrorTryOrder(u)).toEqual([
      u,
      "https://dd.weather.gc.ca/today/air_quality/doc/x.xml",
    ]);
  });
});
