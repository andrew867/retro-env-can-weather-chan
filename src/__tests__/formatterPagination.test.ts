import { formatStringTo8x32, paginateText8x32, wrapTextToLineBudget } from "lib/display";
import { DISPLAY_MAX_CHARACTERS_PER_LINE } from "consts";

describe("wrapTextToLineBudget", () => {
  it("returns a single line when text fits width", () => {
    const t = "x".repeat(DISPLAY_MAX_CHARACTERS_PER_LINE);
    const { lines, remainder } = wrapTextToLineBudget(t, 4);
    expect(lines).toStrictEqual([t]);
    expect(remainder).toBe("");
  });

  it("wraps at spaces and leaves remainder", () => {
    const w = DISPLAY_MAX_CHARACTERS_PER_LINE;
    const chunk = "xy ".repeat(20).trim();
    expect(chunk.length).toBeGreaterThan(w);
    const { lines, remainder } = wrapTextToLineBudget(chunk, 1);
    expect(lines.length).toBe(1);
    expect(lines[0].length).toBeLessThanOrEqual(w);
    expect(remainder.length).toBeGreaterThan(0);
  });

  it("hard-breaks when no space in first width chars", () => {
    const w = DISPLAY_MAX_CHARACTERS_PER_LINE;
    const text = "a".repeat(w + 5);
    const { lines, remainder } = wrapTextToLineBudget(text, 1);
    expect(lines[0].length).toBe(w);
    expect(remainder).toBe("aaaaa");
  });
});

describe("paginateText8x32", () => {
  it("returns one page when all text fits first page", () => {
    const pages = paginateText8x32("short text", 4, 6);
    expect(pages).toStrictEqual(["short text"]);
  });

  it("splits overflow into continuation pages without losing characters", () => {
    const parts: string[] = [];
    for (let i = 0; i < 24; i++) parts.push(`w${i}x`);
    const text = parts.join(" ");
    const pages = paginateText8x32(text, 2, 3);
    expect(pages.length).toBeGreaterThan(1);
    const recovered = pages.join("\n").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    expect(recovered.replace(/\s+/g, "")).toBe(text.replace(/\s+/g, ""));
  });
});

describe("formatStringTo8x32 (first page only)", () => {
  it("truncates to maxLines for alert-style use", () => {
    const w = DISPLAY_MAX_CHARACTERS_PER_LINE;
    const line = "a".repeat(w - 2) + " bb";
    const text = `${line} ${line} ${line}`;
    const out = formatStringTo8x32(text, 2);
    const lines = out.split("\n").filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});
