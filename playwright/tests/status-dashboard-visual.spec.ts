import { test, expect } from "@playwright/test";

/** Frozen snapshot so the status page screenshot does not drift on timestamps/uptime. */
const FROZEN_STATUS = {
  statusSchemaVersion: 2,
  server: { uptimeSec: 42, packageVersion: "9.9.9-test", nodeEnv: "test" },
  feeds: {
    citypage: {
      dataFetchedAt: "2026-04-08T12:00:00.000Z",
      servedDataAsOf: "2026-04-08T12:00:00.000Z",
      source: "live",
      observationId: "obs-frozen",
    },
    national: {
      dataFetchedAt: "2026-04-08T12:00:00.000Z",
      servedDataAsOf: "2026-04-08T12:00:00.000Z",
      source: "live",
    },
    usa: {
      dataFetchedAt: "2026-04-08T11:55:00.000Z",
      servedDataAsOf: "2026-04-08T11:55:00.000Z",
      source: "lkg",
    },
    airport_metar: {
      dataFetchedAt: "2026-04-08T12:01:00.000Z",
      servedDataAsOf: "2026-04-08T12:01:00.000Z",
      source: "live",
    },
    province: {
      dataFetchedAt: "2026-04-08T11:50:00.000Z",
      servedDataAsOf: "2026-04-08T11:50:00.000Z",
      source: "live",
    },
    sunspots: {
      dataFetchedAt: null as string | null,
      servedDataAsOf: null as string | null,
      source: "none",
      note: "No data yet, or outside sunspot season (operator refresh is a no-op then).",
    },
    hot_cold: {
      dataFetchedAt: "2026-04-08T10:00:00.000Z",
      servedDataAsOf: "2026-04-08T10:00:00.000Z",
      source: "live",
    },
    alerts: {
      dataFetchedAt: "2026-04-08T09:00:00.000Z",
      servedDataAsOf: "2026-04-08T09:00:00.000Z",
      source: "live",
      count: 0,
      capAmqpReceived: 12,
      capAmqpLastRxAt: "2026-04-08T09:15:30.000Z",
      note: "New CAP files arrive via AMQP; refresh runs expiry trim only.",
    },
    historical: {
      dataFetchedAt: "2026-04-08T08:00:00.000Z",
      servedDataAsOf: "2026-04-08T08:00:00.000Z",
      source: "live",
    },
    climate_normals: {
      dataFetchedAt: "2026-04-08T08:05:00.000Z",
      servedDataAsOf: "2026-04-08T08:05:00.000Z",
      source: "live",
    },
    aqhi: {
      dataFetchedAt: null as string | null,
      servedDataAsOf: null as string | null,
      source: "none",
      note: "No station configured or observation empty.",
    },
  },
};

test.describe("status dashboard (mocked API)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/status", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FROZEN_STATUS),
      });
    });
    await page.route("**/api/v1/status/refresh", async (route) => {
      await route.fulfill({ status: 202, contentType: "application/json", body: "{}" });
    });
  });

  test("status page layout", async ({ page }) => {
    await page.goto("/status");
    await expect(page.getByRole("heading", { name: /data status/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /refresh all feeds/i })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Citypage (observed / forecast / almanac)" })).toBeVisible();
    await expect(page).toHaveScreenshot("status-dashboard.png", { fullPage: true });
  });
});
