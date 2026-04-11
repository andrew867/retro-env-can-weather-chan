import { test, expect } from "@playwright/test";

/**
 * Locations & feeds tab — LTCE virtual station search table (mocked API so CI stays deterministic).
 */
test.describe("config LTCE station search (Locations tab)", () => {
  test("search shows table and applies virtual id", async ({ page }) => {
    await page.route("**/api/v1/config/ltce-stations", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          results: [
            {
              virtualClimateId: "VSMB38V",
              virtualStationNameEn: "WINNIPEG AREA",
              wxoCityCode: "MB-38",
              provinceCode: "MB",
            },
            {
              virtualClimateId: "VSON143",
              virtualStationNameEn: "TORONTO AREA",
              wxoCityCode: "ON-143",
              provinceCode: "ON",
            },
          ].sort((a, b) => a.virtualStationNameEn.localeCompare(b.virtualStationNameEn, "en")),
        }),
      });
    });

    await page.goto("/config");
    await expect(page.getByRole("heading", { name: /weather simulator config/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("tab", { name: /locations/i }).click();

    await page.getByLabel(/area name/i).fill("Winnipeg");
    await page.getByRole("button", { name: /search ltce/i }).click();

    await expect(page.getByRole("cell", { name: "VSMB38V" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "WINNIPEG AREA" })).toBeVisible();

    await expect(page.locator("#ltce_virtual_station_search")).toHaveScreenshot("config-ltce-search-table.png", {
      animations: "disabled",
    });

    await page
      .getByRole("row", { name: /VSMB38V/ })
      .getByRole("button", { name: "Use" })
      .click();
    await expect(page.locator("#ltceVirtualClimateId")).toHaveValue("VSMB38V");
  });
});
