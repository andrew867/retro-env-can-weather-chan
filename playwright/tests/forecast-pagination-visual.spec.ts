import path from "path";
import { test, expect } from "@playwright/test";
import { buildForecastScreenBodies } from "../../src/lib/display/forecastScreenBodies";
import { SCREEN_DEFAULT_DISPLAY_LENGTH } from "../../src/consts/screens.consts";
import {
  buildForecastOnlyInit,
  buildMultiPageForecastStation,
} from "../fixtures/forecastVisualStation";

const mockEventSourcePath = path.join(__dirname, "../helpers/mock-event-source.js");

test.describe("forecast pagination visuals", () => {
  test("each forecast playlist page matches snapshot", async ({ page }) => {
    const station = buildMultiPageForecastStation();
    const init = buildForecastOnlyInit();
    const bodies = buildForecastScreenBodies(station, undefined);
    const pageCount = Math.max(1, bodies.length);

    await page.clock.install({ time: new Date("2026-04-07T22:00:00.000Z") });

    await page.addInitScript({ content: `window.__PW_STATION__ = ${JSON.stringify(station)};` });
    await page.addInitScript({ path: mockEventSourcePath });

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/init")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify(init),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: "{}",
      });
    });

    await page.goto("/");

    await expect(page.locator("#forecast_screen")).toBeVisible({ timeout: 30_000 });

    // First playlist page: reload-line reveal (many condition + forecast lines).
    await page.clock.fastForward(3_000);

    const footer = page.locator("#footer_bar");
    const shotOpts = {
      fullPage: true,
      mask: [footer],
      animations: "disabled" as const,
    };

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) {
        await page.clock.fastForward(SCREEN_DEFAULT_DISPLAY_LENGTH * 1000 + 500);
      }
      await expect(page).toHaveScreenshot(`forecast-page-${String(i).padStart(2, "0")}.png`, shotOpts);
    }
  });
});
