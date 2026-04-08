import { mergeDefined } from "lib/mergeDefined";

describe("mergeDefined", () => {
  it("merges defined keys and keeps previous values when patch has undefined", () => {
    const prev = { a: 1, b: 2, c: 3 };
    const patch = { b: undefined as unknown as number, c: 4 };
    expect(mergeDefined(prev, patch)).toStrictEqual({ a: 1, b: 2, c: 4 });
  });
});
