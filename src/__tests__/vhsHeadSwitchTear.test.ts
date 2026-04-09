import { smoothVhsTearOffset } from "lib/display/vhsHeadSwitchTear";

describe("vhsHeadSwitchTear", () => {
  it("smooths toward target", () => {
    expect(smoothVhsTearOffset(0, 10, 0.5)).toBe(5);
    expect(smoothVhsTearOffset(5, 10, 0.5)).toBe(7.5);
  });

  it("clamps alpha to 0–1", () => {
    expect(smoothVhsTearOffset(0, 10, 2)).toBe(10);
    expect(smoothVhsTearOffset(10, 0, -1)).toBe(10);
  });

  it("returns 0 for non-finite inputs", () => {
    expect(smoothVhsTearOffset(NaN, 1, 0.5)).toBe(0);
    expect(smoothVhsTearOffset(0, NaN, 0.5)).toBe(0);
  });
});
