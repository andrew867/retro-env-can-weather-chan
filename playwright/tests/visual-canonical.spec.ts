import { test, expect } from "@playwright/test";

test.describe("canonical display screens", () => {
  test("home and config", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });

    await page.goto("/config");
    await expect(page).toHaveScreenshot("config.png", { fullPage: true });
  });
});
