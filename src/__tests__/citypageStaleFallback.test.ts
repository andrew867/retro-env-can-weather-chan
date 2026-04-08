import { subHours } from "date-fns";
import {
  shouldRunCitypageStaleHttpPoll,
  DEFAULT_CITYPAGE_STALE_FALLBACK_AFTER_MS,
} from "lib/eccc/citypageStaleFallback";

describe("citypageStaleFallback", () => {
  const staleAfter = DEFAULT_CITYPAGE_STALE_FALLBACK_AFTER_MS;

  it("requests poll when there was never a successful fetch", () => {
    expect(shouldRunCitypageStaleHttpPoll(null, Date.now(), staleAfter)).toBe(true);
    expect(shouldRunCitypageStaleHttpPoll("", Date.now(), staleAfter)).toBe(true);
  });

  it("requests poll when last fetch ISO is invalid", () => {
    expect(shouldRunCitypageStaleHttpPoll("not-a-date", Date.now(), staleAfter)).toBe(true);
  });

  it("skips poll when last fetch is within the stale window", () => {
    const recent = new Date().toISOString();
    expect(shouldRunCitypageStaleHttpPoll(recent, Date.now(), staleAfter)).toBe(false);
  });

  it("requests poll when last fetch is older than the stale window", () => {
    const old = subHours(new Date(), 3).toISOString();
    expect(shouldRunCitypageStaleHttpPoll(old, Date.now(), staleAfter)).toBe(true);
  });
});
