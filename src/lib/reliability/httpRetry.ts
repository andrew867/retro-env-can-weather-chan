import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  rwcHttpRetryBackoffMaxMs,
  rwcHttpRetryBackoffMinMs,
  rwcHttpRetryCount,
} from "consts/reliability.consts";
import {
  upstreamCircuitAllowRequest,
  upstreamCircuitRecordFailureFromError,
  upstreamCircuitRecordSuccess,
} from "lib/reliability/upstreamCircuit";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jitterBackoffMs(attemptIndex: number): number {
  const minMs = rwcHttpRetryBackoffMinMs();
  const maxMs = rwcHttpRetryBackoffMaxMs();
  const cap = Math.min(maxMs, minMs * 2 ** attemptIndex);
  return minMs + Math.random() * Math.max(0, cap - minMs);
}

function shouldRetryUpstream(err: unknown): boolean {
  const e = err as { response?: { status?: number }; code?: string };
  const s = e?.response?.status;
  if (s === 404) return false;
  if (s != null && s >= 400 && s < 500 && s !== 408 && s !== 429) return false;
  return true;
}

/** Bounded GET retries for a single absolute URL (NWS, AWC, etc.). */
export async function axiosGetWithRetry<T = unknown>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const maxExtra = rwcHttpRetryCount();
  let lastError: unknown;
  for (let wave = 0; wave <= maxExtra; wave++) {
    if (wave > 0) {
      await sleep(jitterBackoffMs(wave - 1));
    }
    if (!upstreamCircuitAllowRequest(url)) {
      lastError = new Error(`upstream cool-off: ${url}`);
      continue;
    }
    try {
      const res = await client.get<T>(url, config);
      upstreamCircuitRecordSuccess(url);
      return res;
    } catch (err) {
      lastError = err;
      upstreamCircuitRecordFailureFromError(url, err);
      if (!shouldRetryUpstream(err)) break;
    }
  }
  throw lastError;
}
