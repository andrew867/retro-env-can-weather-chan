import {
  baseMsPerGrapheme,
  computeStepDelayMs,
  isStreamablePlaintext,
  segmentGraphemes,
} from "lib/display/authenticRefreshScheduler";

describe("authenticRefreshScheduler", () => {
  it("segmentGraphemes returns array for ASCII", () => {
    expect(segmentGraphemes("Hi")).toEqual(["H", "i"]);
  });

  it("baseMsPerGrapheme clamps cps", () => {
    expect(baseMsPerGrapheme(10)).toBe(100);
    expect(baseMsPerGrapheme(1)).toBe(1000);
    expect(baseMsPerGrapheme(200)).toBe(Math.round(1000 / 120));
  });

  it("computeStepDelayMs includes jitter range", () => {
    for (let i = 0; i < 20; i++) {
      const d = computeStepDelayMs({ charsPerSecond: 10, jitterMsPerCharMax: 10 });
      expect(d).toBeGreaterThanOrEqual(100);
      expect(d).toBeLessThanOrEqual(110);
    }
  });

  it("isStreamablePlaintext", () => {
    expect(isStreamablePlaintext("")).toBe(false);
    expect(isStreamablePlaintext("   ")).toBe(false);
    expect(isStreamablePlaintext("a")).toBe(true);
  });
});
