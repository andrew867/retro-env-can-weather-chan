import { feedSourceFromTimestamps } from "lib/status/feedSource";
import { isStatusRefreshTarget, STATUS_SCHEMA_VERSION } from "lib/status/buildSnapshot";
import { isStatusDashboardEnabled, statusAuthToken } from "lib/status/statusEnv";

describe("status dashboard helpers", () => {
  const orig = {
    NODE_ENV: process.env.NODE_ENV,
    RWC_STATUS_ENABLED: process.env.RWC_STATUS_ENABLED,
    RWC_STATUS_TOKEN: process.env.RWC_STATUS_TOKEN,
    RWC_METRICS_TOKEN: process.env.RWC_METRICS_TOKEN,
  };

  afterEach(() => {
    process.env.NODE_ENV = orig.NODE_ENV;
    for (const key of ["RWC_STATUS_ENABLED", "RWC_STATUS_TOKEN", "RWC_METRICS_TOKEN"] as const) {
      if (orig[key] === undefined) delete process.env[key];
      else process.env[key] = orig[key];
    }
  });

  it("classifies feed source from timestamps", () => {
    expect(feedSourceFromTimestamps(null, null)).toBe("none");
    expect(feedSourceFromTimestamps("2020-01-01T00:00:00.000Z", "2020-01-01T00:00:00.000Z")).toBe("live");
    expect(feedSourceFromTimestamps("2020-01-01T00:00:00.000Z", "2019-12-31T00:00:00.000Z")).toBe("lkg");
  });

  it("validates refresh targets", () => {
    expect(isStatusRefreshTarget("national")).toBe(true);
    expect(isStatusRefreshTarget("nope")).toBe(false);
  });

  it("gates status API in production unless RWC_STATUS_ENABLED=1", () => {
    process.env.NODE_ENV = "production";
    delete process.env.RWC_STATUS_ENABLED;
    expect(isStatusDashboardEnabled()).toBe(false);
    process.env.RWC_STATUS_ENABLED = "1";
    expect(isStatusDashboardEnabled()).toBe(true);
  });

  it("allows status when not production", () => {
    process.env.NODE_ENV = "development";
    delete process.env.RWC_STATUS_ENABLED;
    expect(isStatusDashboardEnabled()).toBe(true);
  });

  it("prefers RWC_STATUS_TOKEN over metrics token", () => {
    process.env.RWC_STATUS_TOKEN = "a";
    process.env.RWC_METRICS_TOKEN = "b";
    expect(statusAuthToken()).toBe("a");
    delete process.env.RWC_STATUS_TOKEN;
    expect(statusAuthToken()).toBe("b");
  });

  it("exports a stable schema version", () => {
    expect(STATUS_SCHEMA_VERSION).toBe(2);
  });
});
