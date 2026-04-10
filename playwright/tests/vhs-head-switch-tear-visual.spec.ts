import path from "path";
import { test, expect } from "@playwright/test";
import { buildVhsTearInit, buildVhsTearStation } from "../fixtures/vhsTearVisual";

const mockEventSourcePath = path.join(__dirname, "../helpers/mock-event-source.js");

/**
 * Bottom-of-frame head-switch band must be visible in pixels (OBS / browser) on broadcast blue.
 * `?e2eVhsTear=1` freezes horizontal offset for stable snapshots (see `isE2eStaticVhsTear`).
 */
test.describe("VHS head-switch tear (bottom band)", () => {
  test("bottom strip shows tear + scanlines over 4:3 raster", async ({ page }) => {
    const station = buildVhsTearStation();
    const init = buildVhsTearInit();

    await page.clock.install({ time: new Date("2026-04-09T18:00:00.000Z") });
    await page.emulateMedia({ reducedMotion: "no-preference" });

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

    await page.goto("/?e2eVhsTear=1");

    await expect(page.locator("#almanac_screen")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".gfx-vhs-head-switch-tear")).toBeVisible();

    await page.waitForTimeout(400);

    const host = page.locator("#weather_channel");
    const box = await host.boundingBox();
    expect(box).toBeTruthy();
    const bandH = Math.min(72, Math.max(48, Math.round((box as { height: number }).height * 0.14)));
    const clip = {
      x: (box as { x: number }).x,
      y: (box as { y: number }).y + (box as { height: number }).height - bandH,
      width: (box as { width: number }).width,
      height: bandH,
    };

    await expect(page).toHaveScreenshot("vhs-tear-bottom-band.png", {
      clip,
      animations: "disabled",
      maxDiffPixels: 2500,
    });
  });
});
