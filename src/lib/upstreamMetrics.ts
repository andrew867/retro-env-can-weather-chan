import type { AxiosError } from "axios";
import axios from "axios";

export type UpstreamMetricSnapshot = {
  backendAxios: {
    requestCount: number;
    successCount: number;
    errorCount: number;
    timeoutCount: number;
    status4xx: number;
    status5xx: number;
    networkError: number;
  };
  since: string;
};

const backend = {
  requestCount: 0,
  successCount: 0,
  errorCount: 0,
  timeoutCount: 0,
  status4xx: 0,
  status5xx: 0,
  networkError: 0,
};

const startedAt = new Date().toISOString();

function classifyAxiosError(err: unknown): void {
  if (!axios.isAxiosError(err)) {
    backend.networkError += 1;
    return;
  }
  const ax = err as AxiosError;
  if (ax.code === "ECONNABORTED" || ax.message?.toLowerCase().includes("timeout")) {
    backend.timeoutCount += 1;
    return;
  }
  const s = ax.response?.status;
  if (s != null) {
    if (s >= 500) backend.status5xx += 1;
    else if (s >= 400) backend.status4xx += 1;
    else backend.networkError += 1;
  } else {
    backend.networkError += 1;
  }
}

/** Attach once to the shared backend axios instance. */
export function attachBackendAxiosMetrics(client: typeof axios): void {
  client.interceptors.response.use(
    (res) => {
      backend.requestCount += 1;
      backend.successCount += 1;
      return res;
    },
    (err) => {
      if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") {
        return Promise.reject(err);
      }
      backend.requestCount += 1;
      backend.errorCount += 1;
      classifyAxiosError(err);
      return Promise.reject(err);
    }
  );
}

export function getUpstreamMetricsSnapshot(): UpstreamMetricSnapshot {
  return {
    backendAxios: { ...backend },
    since: startedAt,
  };
}

export function resetUpstreamMetricsForTests(): void {
  backend.requestCount = 0;
  backend.successCount = 0;
  backend.errorCount = 0;
  backend.timeoutCount = 0;
  backend.status4xx = 0;
  backend.status5xx = 0;
  backend.networkError = 0;
}
