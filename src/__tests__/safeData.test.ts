import { coerceArray, coerceStringLines, isPlainObject } from "lib/display/safeData";

describe("safeData", () => {
  it("coerceArray returns [] for non-arrays", () => {
    expect(coerceArray(undefined)).toStrictEqual([]);
    expect(coerceArray(null)).toStrictEqual([]);
    expect(coerceArray({})).toStrictEqual([]);
    expect(coerceArray("x")).toStrictEqual([]);
  });

  it("coerceArray preserves arrays", () => {
    expect(coerceArray([1, 2])).toStrictEqual([1, 2]);
  });

  it("coerceStringLines accepts arrays and strings", () => {
    expect(coerceStringLines(["a", 2])).toStrictEqual(["a", "2"]);
    expect(coerceStringLines("one")).toStrictEqual(["one"]);
    expect(coerceStringLines(null)).toStrictEqual([]);
  });

  it("isPlainObject rejects arrays and null", () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
  });
});
