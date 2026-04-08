/** In-process counters for MSC public AMQP listeners (citypage + CAP). No PII. */

export type MscAmqpListenerRole = "citypage" | "alerts";

export type MscAmqpListenerStats = {
  messageCount: number;
  errorEventCount: number;
  lastMessageAt: string | null;
  lastErrorAt: string | null;
};

const empty = (): MscAmqpListenerStats => ({
  messageCount: 0,
  errorEventCount: 0,
  lastMessageAt: null,
  lastErrorAt: null,
});

const citypage = empty();
const alerts = empty();

function bucket(role: MscAmqpListenerRole): MscAmqpListenerStats {
  return role === "citypage" ? citypage : alerts;
}

export function recordMscAmqpMessage(role: MscAmqpListenerRole): void {
  const b = bucket(role);
  b.messageCount += 1;
  b.lastMessageAt = new Date().toISOString();
}

export function recordMscAmqpErrorEvent(role: MscAmqpListenerRole): void {
  const b = bucket(role);
  b.errorEventCount += 1;
  b.lastErrorAt = new Date().toISOString();
}

/** Snapshot for `/metrics` and `/health`. */
export function getMscAmqpStatsSnapshot(): Record<MscAmqpListenerRole, MscAmqpListenerStats> {
  return {
    citypage: { ...citypage },
    alerts: { ...alerts },
  };
}

/** Reset in-process counters (Jest isolation). */
export function resetMscAmqpStatsForTests(): void {
  for (const b of [citypage, alerts]) {
    b.messageCount = 0;
    b.errorEventCount = 0;
    b.lastMessageAt = null;
    b.lastErrorAt = null;
  }
}
