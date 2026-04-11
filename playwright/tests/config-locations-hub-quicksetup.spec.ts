import { test, expect } from "@playwright/test";

test.describe("Locations hub — quick setup", () => {
  test("POST locationQuickSetup is invoked from Apply button (mocked)", async ({ page }) => {
    let posted = false;
    await page.route("**/api/v1/config/locationQuickSetup", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      posted = true;
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/api/v1/config/stations", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({
          results: [{ name: "Testville", province: "ON", location: "s0000999" }],
        }),
      });
    });

    await page.goto("/config");
    await expect(page.getByRole("heading", { name: /weather simulator config/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("tab", { name: /locations/i }).click();

    await page.getByLabel(/city \/ town search/i).fill("Test");
    await page.locator("#location_quick_setup").getByRole("button", { name: /^search$/i }).click();
    await expect(page.getByRole("cell", { name: "Testville" })).toBeVisible();

    await page.getByRole("button", { name: /use for quick setup/i }).click();
    await page.getByRole("button", { name: /apply quick setup/i }).click();

    await expect.poll(() => posted).toBe(true);
  });
});
