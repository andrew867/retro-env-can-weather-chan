import MockDate from "mockdate";
import { isSnapshotStale, STALE_SNAPSHOT_THRESHOLD_MINUTES } from "lib/display/dataFreshness";

describe("isSnapshotStale", () => {
  afterEach(() => {
    MockDate.reset();
  });

  it("returns false for fresh timestamps", () => {
    MockDate.set("2026-04-07T12:00:00.000Z");
    const iso = new Date(Date.now() - (STALE_SNAPSHOT_THRESHOLD_MINUTES - 1) * 60 * 1000).toISOString();
    expect(isSnapshotStale(iso)).toBe(false);
  });

  it("returns true past threshold", () => {
    MockDate.set("2026-04-07T12:00:00.000Z");
    const iso = new Date(Date.now() - (STALE_SNAPSHOT_THRESHOLD_MINUTES + 1) * 60 * 1000).toISOString();
    expect(isSnapshotStale(iso)).toBe(true);
  });

  it("returns false for missing iso", () => {
    expect(isSnapshotStale(null)).toBe(false);
    expect(isSnapshotStale(undefined)).toBe(false);
  });
});
