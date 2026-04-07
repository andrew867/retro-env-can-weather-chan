/**
 * MSC Datamart HTTP mirrors: high-throughput HPFX (primary) vs redundant Datamart (fallback).
 * See https://hpfx.collab.science.gc.ca/ — long-term, consider Sarracenia/AMQP delivery:
 * https://metpx.github.io/sarracenia/How2Guides/subscriber.html
 */
import { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";

export const MSC_HPFX_ORIGIN = "https://hpfx.collab.science.gc.ca";
export const MSC_DATAMART_ORIGIN = "https://dd.weather.gc.ca";

/** Normalize legacy http://dd.weather.gc.ca links to https for consistent mirror swaps. */
export function normalizeMscHttpUrl(url: string): string {
  return url.replace(/^http:\/\/dd\.weather\.gc\.ca\b/i, `${MSC_DATAMART_ORIGIN}`);
}

/**
 * For dd.weather.gc.ca or hpfx.collab.science.gc.ca URLs, return [try first, try second]:
 * always prefer HPFX first, then Datamart. Other hosts are returned unchanged (single attempt).
 */
export function mscMirrorTryOrder(url: string): string[] {
  const normalized = normalizeMscHttpUrl(url);
  let u: URL;
  try {
    u = new URL(normalized);
  } catch {
    return [url];
  }

  if (u.hostname === "hpfx.collab.science.gc.ca") {
    const datamart = `${MSC_DATAMART_ORIGIN}${u.pathname}${u.search}${u.hash}`;
    return normalized === datamart ? [normalized] : [normalized, datamart];
  }
  if (u.hostname === "dd.weather.gc.ca") {
    const hpfx = `${MSC_HPFX_ORIGIN}${u.pathname}${u.search}${u.hash}`;
    return hpfx === normalized ? [normalized] : [hpfx, normalized];
  }
  return [normalized];
}

export function shouldRetryMscMirror(err: unknown): boolean {
  if (!isAxiosError(err)) return true;
  if (err.code === "ERR_CANCELED") return false;
  const status = err.response?.status;
  if (status == null) return true;
  if (status >= 500) return true;
  if (status === 404) return true;
  if (status === 403) return true;
  return false;
}

/** GET with HPFX-first / Datamart-failover for MSC mirror host pairs. */
export async function axiosGetWithMscMirror<T = unknown>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const candidates = [...new Set(mscMirrorTryOrder(url))];
  let lastError: unknown;
  for (let i = 0; i < candidates.length; i++) {
    try {
      return await client.get<T>(candidates[i], config);
    } catch (err) {
      lastError = err;
      if (i === candidates.length - 1) break;
      if (!shouldRetryMscMirror(err)) break;
    }
  }
  throw lastError;
}
