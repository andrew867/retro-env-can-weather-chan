import { defineConfig } from "@playwright/test";

const port = 8600;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./playwright/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  /** One baseline per screenshot name (avoid separate linux/win32 files in repo). */
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  use: {
    baseURL,
  },
  webServer: {
    command: "yarn build:display && yarn start",
    url: `${baseURL}/`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    toHaveScreenshot: { maxDiffPixels: 400 },
  },
});
