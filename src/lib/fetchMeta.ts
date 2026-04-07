import type { AxiosResponse } from "axios";

/** Reads `X-RWC-Data-Fetched-At` from an axios response (header keys are lowercased in browsers). */
export function getDataFetchedAtHeader<T>(resp: AxiosResponse<T>): string | null {
  const h = resp.headers as Record<string, string | undefined> & {
    get?: (name: string) => string | undefined;
  };
  const fromGet = typeof h.get === "function" ? h.get("x-rwc-data-fetched-at") : undefined;
  const raw = fromGet ?? h["x-rwc-data-fetched-at"];
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
