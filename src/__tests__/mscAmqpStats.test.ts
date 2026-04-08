import {
  getMscAmqpStatsSnapshot,
  recordMscAmqpErrorEvent,
  recordMscAmqpMessage,
  resetMscAmqpStatsForTests,
} from "lib/amqp/mscAmqpStats";
import { getUpstreamMetricsSnapshot, resetUpstreamMetricsForTests } from "lib/upstreamMetrics";

describe("mscAmqpStats", () => {
  beforeEach(() => {
    resetMscAmqpStatsForTests();
  });

  it("records messages and errors per role", () => {
    recordMscAmqpMessage("citypage");
    recordMscAmqpMessage("citypage");
    recordMscAmqpErrorEvent("alerts");

    const s = getMscAmqpStatsSnapshot();
    expect(s.citypage.messageCount).toBe(2);
    expect(s.citypage.errorEventCount).toBe(0);
    expect(s.citypage.lastMessageAt).toMatch(/^\d{4}-/);
    expect(s.alerts.messageCount).toBe(0);
    expect(s.alerts.errorEventCount).toBe(1);
    expect(s.alerts.lastErrorAt).toMatch(/^\d{4}-/);
  });

  it("is included on upstream metrics snapshot", () => {
    resetUpstreamMetricsForTests();
    recordMscAmqpMessage("alerts");
    const snap = getUpstreamMetricsSnapshot();
    expect(snap.mscAmqp.alerts.messageCount).toBe(1);
    expect(snap.mscAmqp.citypage.messageCount).toBe(0);
    expect(snap.upstreamCircuits).toEqual({});
  });
});
