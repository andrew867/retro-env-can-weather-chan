import path from "path";
import { test, expect } from "@playwright/test";
import { buildCanonicalHomeInit, buildCanonicalHomeStation } from "../fixtures/canonicalHomeVisual";

const mockEventSourcePath = path.join(__dirname, "../helpers/mock-event-source.js");

const mockAqhi = {
  day: 9,
  month: 4,
  hour: 6,
  isPM: false,
  value: 2,
  textValue: "Good",
};

test.describe("canonical display screens", () => {
  test("home and config", async ({ page }) => {
    const station = buildCanonicalHomeStation();
    const init = buildCanonicalHomeInit();

    await page.clock.install({ time: new Date("2026-04-09T18:22:51.000Z") });
    await page.addInitScript({ content: `window.__PW_STATION__ = ${JSON.stringify(station)};` });
    await page.addInitScript({ path: mockEventSourcePath });

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/init") && !url.includes("init/stream")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify(init),
        });
        return;
      }
      if (url.includes("airquality")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify(mockAqhi),
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
    await page.clock.fastForward(3_000);

    await expect(page).toHaveScreenshot("home.png", {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator("#footer_bar"), page.locator("#crawler")],
    });

    await new Promise((r) => setTimeout(r, 300));
    await page.goto("/config");
    await expect(page).toHaveScreenshot("config.png", {
      fullPage: true,
      animations: "disabled",
    });
  });
});
