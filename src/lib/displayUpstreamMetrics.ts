import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";
import type { OutboundAxiosMetricsBucket } from "lib/upstreamMetrics";

const display = {
  requestCount: 0,
  successCount: 0,
  errorCount: 0,
  timeoutCount: 0,
  status4xx: 0,
  status5xx: 0,
  networkError: 0,
};

function classifyAxiosError(err: unknown): void {
  if (!axios.isAxiosError(err)) {
    display.networkError += 1;
    return;
  }
  const ax = err as AxiosError;
  if (ax.code === "ECONNABORTED" || ax.message?.toLowerCase().includes("timeout")) {
    display.timeoutCount += 1;
    return;
  }
  const s = ax.response?.status;
  if (s != null) {
    if (s >= 500) display.status5xx += 1;
    else if (s >= 400) display.status4xx += 1;
    else display.networkError += 1;
  } else {
    display.networkError += 1;
  }
}

/** Attach once to the display `axios` instance (`lib/axios`). */
export function attachDisplayAxiosMetrics(client: AxiosInstance): void {
  client.interceptors.response.use(
    (res) => {
      display.requestCount += 1;
      display.successCount += 1;
      return res;
    },
    (err) => {
      if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") {
        return Promise.reject(err);
      }
      display.requestCount += 1;
      display.errorCount += 1;
      classifyAxiosError(err);
      return Promise.reject(err);
    }
  );
}

export function getDisplayAxiosSnapshot(): OutboundAxiosMetricsBucket {
  return { ...display };
}

export function resetDisplayUpstreamMetricsForTests(): void {
  display.requestCount = 0;
  display.successCount = 0;
  display.errorCount = 0;
  display.timeoutCount = 0;
  display.status4xx = 0;
  display.status5xx = 0;
  display.networkError = 0;
}
