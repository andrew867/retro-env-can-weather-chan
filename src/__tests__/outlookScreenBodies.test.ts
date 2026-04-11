import { buildForecastScreenBodies } from "lib/display/forecastScreenBodies";
import { buildOutlookPlaylistPages } from "lib/display/outlookScreenBodies";

describe("buildOutlookPlaylistPages", () => {
  it("returns one page with the full body so the outlook is a single rotator plate", () => {
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
    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe("Outlook for Southern Manitoba");
    expect(pages[0].bodyLines).toEqual(lines);
    expect(pages[0].bodyLines[6]).toMatch(/Normal Low -4\. High 8\./);
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
