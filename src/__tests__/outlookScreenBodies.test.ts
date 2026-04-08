import { buildForecastScreenBodies } from "lib/display/forecastScreenBodies";
import { buildOutlookPlaylistPages } from "lib/display/outlookScreenBodies";

describe("buildOutlookPlaylistPages", () => {
  it("keeps each day’s condition line with its period line (no orphan SUNNY page)", () => {
    const lines = [
      "THURSDAY....Low -6.  High 3.",
      "     A MIX OF SUN AND CLOUD.",
      "FRIDAY......Low -3.  High 5.",
      "     SUNNY.",
      "SATURDAY....Low 8.  High 9.",
      "     SUNNY.",
      "Normal Low -4. High 8.",
    ];
    const pages = buildOutlookPlaylistPages("Outlook for Southern Manitoba", lines);
    expect(pages.length).toBe(2);
    expect(pages[0].bodyLines).toHaveLength(4);
    expect(pages[1].bodyLines).toHaveLength(3);
    expect(pages[1].bodyLines[2]).toMatch(/Normal Low -4\. High 8\./);
    expect(pages[1].bodyLines.some((l) => l.includes("SUNNY"))).toBe(true);
  });
});

describe("buildForecastScreenBodies supplementary merge", () => {
  it("merges the four supplementary slots into one pagination pass", () => {
    const station = {
      forecast: [
        { period: "Today", abbreviatedTextSummary: "Sun" },
        { period: "Wednesday", abbreviatedTextSummary: "Snow." },
        { period: "Thursday night", abbreviatedTextSummary: "Clear." },
        { period: "Friday", abbreviatedTextSummary: "Rain." },
        { period: "Saturday", abbreviatedTextSummary: "Nice." },
      ],
    } as unknown as import("types").WeatherStation;

    const bodies = buildForecastScreenBodies(station, undefined);
    expect(bodies.length).toBe(2);
    const merged = bodies[1].replace(/\s+/g, " ");
    expect(merged).toMatch(/Wednesday/i);
    expect(merged).toMatch(/Thursday night/i);
    expect(merged).toMatch(/Friday/i);
    expect(merged).toMatch(/Saturday/i);
  });
});
