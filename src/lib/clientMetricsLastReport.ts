import type { OutboundAxiosMetricsBucket } from "lib/upstreamMetrics";

let last: OutboundAxiosMetricsBucket | null = null;
let lastAt: string | null = null;

export function setClientMetricsReport(report: OutboundAxiosMetricsBucket): void {
  last = { ...report };
  lastAt = new Date().toISOString();
}

export function getClientMetricsReport(): {
  displayAxiosFromClient: OutboundAxiosMetricsBucket | null;
  displayAxiosReportedAt: string | null;
} {
  return { displayAxiosFromClient: last, displayAxiosReportedAt: lastAt };
}

export function resetClientMetricsReportForTests(): void {
  last = null;
  lastAt = null;
}
