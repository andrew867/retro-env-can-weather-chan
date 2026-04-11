import { DEFAULT_WEATHER_STATION_ID } from "consts";
import {
  getAqhiCityAbbreviation,
  getOutlookForAreaLabel,
  isSouthernOntarioOutlookArea,
} from "lib/display/outlookRegionalLabel";

describe("outlookRegionalLabel (plugin registry + eccc-retro bundle)", () => {
  it("uses southern manitoba / WPG for default Winnipeg site", () => {
    expect(getOutlookForAreaLabel(DEFAULT_WEATHER_STATION_ID, "Winnipeg")).toBe("southern manitoba");
    expect(getAqhiCityAbbreviation(DEFAULT_WEATHER_STATION_ID, "Winnipeg")).toBe("WPG");
  });

  it("uses southern ontario / YHM for Halton and Hamilton MSC site codes", () => {
    expect(getOutlookForAreaLabel("s0000367", "Oakville")).toBe("southern ontario");
    expect(getOutlookForAreaLabel("s0000368", "Burlington")).toBe("southern ontario");
    expect(getOutlookForAreaLabel("s0000549", "Hamilton")).toBe("southern ontario");
    expect(getOutlookForAreaLabel("s0000789", "Halton Hills")).toBe("southern ontario");
    expect(getAqhiCityAbbreviation("s0000367", "Oakville")).toBe("YHM");
  });

  it("matches southern Ontario by city name when station id is unknown", () => {
    expect(isSouthernOntarioOutlookArea("s0000999", "Oakville")).toBe(true);
    expect(getOutlookForAreaLabel("s0000999", "Oakville")).toBe("southern ontario");
  });

  it("falls back to city for other locations", () => {
    expect(getOutlookForAreaLabel("s0000458", "Toronto")).toBe("Toronto");
    expect(getAqhiCityAbbreviation("s0000458", "Toronto")).toBe("Toronto");
  });

  it("uses YYT for St. John’s NL citypage codes", () => {
    expect(getAqhiCityAbbreviation("NL/s0000280", "St. John's")).toBe("YYT");
    expect(getAqhiCityAbbreviation("s0000280", "St. John's")).toBe("YYT");
  });
});
