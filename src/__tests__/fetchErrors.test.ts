import {
  formatFetchError,
  logClientFetchWarning,
  looksLikeClimatedataXml,
  looksLikeClimateNormalsCsv,
  looksLikeNormalsXml,
} from "lib/eccc/fetchErrors";

describe("fetchErrors", () => {
  it("looksLikeClimatedataXml", () => {
    expect(looksLikeClimatedataXml(`<?xml version="1.0"?><climatedata></climatedata>`)).toBe(true);
    expect(looksLikeClimatedataXml("<!DOCTYPE html><html>")).toBe(false);
  });

  it("looksLikeNormalsXml", () => {
    expect(looksLikeNormalsXml(`<?xml version="1.0"?><root><om:ObservationCollection /></root>`)).toBe(true);
    expect(looksLikeNormalsXml(`<?xml version="1.0"?><foo>ObservationCollection</foo>`)).toBe(false);
  });

  it("looksLikeClimateNormalsCsv", () => {
    const header = "CLIMATE_IDENTIFIER,E_NORMAL_ELEMENT_NAME,MONTH\n";
    expect(looksLikeClimateNormalsCsv(header)).toBe(true);
    expect(looksLikeClimateNormalsCsv("<!DOCTYPE html>")).toBe(false);
  });

  it("logClientFetchWarning does not throw", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    logClientFetchWarning("testScope", new Error("x"));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("formatFetchError shortens axios errors", () => {
    const err = Object.assign(new Error("fail"), {
      isAxiosError: true as const,
      response: { status: 404 },
      config: { url: "https://example.com/x" },
    });
    expect(formatFetchError(err)).toContain("404");
    expect(formatFetchError(err)).toContain("example.com");
  });

  it("formatFetchError uses axios code when no response", () => {
    const err = Object.assign(new Error("socket hang up"), {
      isAxiosError: true as const,
      code: "ECONNRESET",
      config: { url: "https://example.com/y" },
    });
    expect(formatFetchError(err)).toBe("ECONNRESET https://example.com/y");
  });
});
