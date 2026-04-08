import { normalizeForecastPlaintext, paginateText8x32 } from "lib/display";
import {
  coalesceSparseForecastTailPages,
  IMMEDIATE_FORECAST_CONTINUATION_LINES,
  immediateLinesFirstPage,
} from "lib/display/forecastScreenBodies";

/** Long forecasts must split into continuation pages without dropping characters. */
const FORECAST_LINES_FIRST_NO_ALERT = immediateLinesFirstPage(false);

function plaintextFromPages(pages: string[]): string {
  return normalizeForecastPlaintext(pages.join("\n").replace(/\n/g, " "));
}

/** Compare pagination round-trips when lines may hard-break long tokens (join uses spaces). */
function sameForecastCharacters(a: string, b: string): boolean {
  return a.replace(/\s+/g, "") === b.replace(/\s+/g, "");
}

describe("forecast continuation pagination (ForecastScreen line budgets)", () => {
  it("splits a long immediate forecast into multiple pages without losing characters", () => {
    const parts: string[] = [];
    for (let i = 0; i < 80; i++) parts.push(`word${i}`);
    const raw = `Forecast for Today..${parts.join(" ")}`;
    const pages = paginateText8x32(raw, FORECAST_LINES_FIRST_NO_ALERT, IMMEDIATE_FORECAST_CONTINUATION_LINES);
    expect(pages.length).toBeGreaterThan(1);
    const recovered = pages.join("\n").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    expect(recovered.replace(/\s+/g, "")).toBe(raw.replace(/\s+/g, ""));
  });

  it("coalesceSparseForecastTailPages keeps the same normalized text as the source string", () => {
    const parts: string[] = [];
    for (let i = 0; i < 80; i++) parts.push(`word${i}`);
    const raw = `Forecast for Today..${parts.join(" ")}`;
    const first = FORECAST_LINES_FIRST_NO_ALERT;
    const cont = IMMEDIATE_FORECAST_CONTINUATION_LINES;
    const baseline = paginateText8x32(raw, first, cont);
    const merged = coalesceSparseForecastTailPages(raw, first, cont);
    expect(sameForecastCharacters(plaintextFromPages(merged), normalizeForecastPlaintext(raw))).toBe(true);
    expect(merged.length).toBeLessThanOrEqual(baseline.length);
  });

  it("coalesceSparseForecastTailPages increases continuation lines until a sparse last page fills or bump cap hits", () => {
    const first = 3;
    const cont = 4;
    const raw =
      "Forecast for Tonight.." +
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA " +
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB " +
      "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC " +
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD " +
      "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE " +
      "ORPHAN";
    const baseline = paginateText8x32(raw, first, cont);
    expect(baseline.length).toBeGreaterThanOrEqual(2);
    const merged = coalesceSparseForecastTailPages(raw, first, cont, 2, 12);
    expect(sameForecastCharacters(plaintextFromPages(merged), normalizeForecastPlaintext(raw))).toBe(true);
    const lastLines = merged[merged.length - 1].split("\n").filter((l) => l.trim().length > 0);
    expect(lastLines.length > 2 || merged.length < baseline.length).toBe(true);
  });
});
