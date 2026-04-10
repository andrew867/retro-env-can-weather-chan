import { test, expect } from "@playwright/test";

/**
 * Uses `?e2eAirportMetar=1` (deterministic rows). Mocks `GET /api/v1/init`.
 * With `CI=true`, Playwright starts a fresh `yarn build:display && yarn start` (port **8600** must be free — stop `yarn dev` or run `npx kill-port 8600`).
 */
const minimalInit = {
  config: {
    font: "consolas",
    provinceHighLowEnabled: false,
    configVersion: "e2e-metar",
    showFooterFreshnessHint: true,
    useOfficialFonts: true,
  },
  gfx: {
    displayAspectRatio: "4:3",
    displayResolution: "sd",
    features: { authenticRefreshEnabled: false, nextGenVisualLayersEnabled: false },
    safeArea: { top: 0.02, bottom: 0.06, left: 0.02, right: 0.02 },
    retro: {
      scanlinesOpacity: 0,
      phosphorTint: "none",
      vignetteStrength: 0,
      vhsAnalogLayerEnabled: false,
      vhsHeadSwitchTearEnabled: false,
      vhsHeadSwitchTearOpacity: 1,
      reloadLineMs: 100,
    },
  },
  authenticRefresh: {
    enabled: false,
    charsPerSecond: 100,
    jitterMsPerCharMax: 12,
    continuationGraphemeReveal: true,
    respectReducedMotion: true,
    streamUnit: "grapheme",
  },
  crawler: [] as unknown[],
  flavour: {
    name: "e2e",
    created: "2026-01-01T00:00:00.000Z",
    modified: "2026-01-01T00:00:00.000Z",
    screens: [{ id: 1, duration: 60 }],
  },
  music: [] as unknown[],
  infoScreen: [] as unknown[],
};

test.describe("airport METAR plate layout", () => {
  test.setTimeout(180_000);

  test("columns stay spaced under channel pre-wrap (e2e fixture)", async ({ page }) => {
    await page.route("**/api/v1/init", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(minimalInit),
      });
    });

    await page.goto("/?e2eAirportMetar=1&e2eVhsTear=1");
    const plate = page.locator("#airport_metar");
    await expect(plate).toBeVisible({ timeout: 120_000 });
    const firstRow = plate.locator("ol li").first();
    const text = await firstRow.textContent();
    expect(text).toMatch(/Winnipeg\s{2,}0/);
    await expect(plate).toHaveScreenshot("airport-metar-plate.png");
  });
});
