import axios from "lib/axios";
import type { AxiosResponse } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { logClientFetchWarning } from "lib/eccc/fetchErrors";
import { getDataFetchedAtHeader } from "lib/fetchMeta";

export type UsePollingFetchOptions<T> = {
  /** When false, do not read `X-RWC-Data-Fetched-At`. Default true. */
  trackFetchedAt?: boolean;
  /**
   * Custom parse; keep stable (wrap in useCallback) if it changes behavior by reference.
   * Default uses `resp.data` as `T`.
   */
  parseResponse?: (resp: AxiosResponse<unknown>) => T | undefined | null;
};

/**
 * Shared client polling pattern: monotonic generation (no stale overwrites), optional
 * `dataFetchedAt` from response headers, and `hasAttempted` after the first round-trip.
 */
export function usePollingFetch<T>(
  path: string,
  intervalMs: number,
  logLabel: string,
  options?: UsePollingFetchOptions<T>
) {
  const [data, setData] = useState<T | undefined>();
  const [dataFetchedAt, setDataFetchedAt] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const gen = useRef(0);
  const parseRef = useRef(options?.parseResponse);
  parseRef.current = options?.parseResponse;
  const trackFetchedAt = options?.trackFetchedAt !== false;

  const fetchData = useCallback(() => {
    const id = ++gen.current;
    axios
      .get(path)
      .then((resp) => {
        if (id !== gen.current) return;
        const parsed = parseRef.current
          ? parseRef.current(resp)
          : (resp.data as T | undefined);
        if (parsed === undefined) return;
        if (parsed === null) {
          setData(undefined);
        } else {
          setData(parsed);
        }
        if (trackFetchedAt) setDataFetchedAt(getDataFetchedAtHeader(resp));
      })
      .catch((err) => logClientFetchWarning(logLabel, err))
      .finally(() => {
        if (id === gen.current) setHasAttempted(true);
      });
  }, [path, logLabel, trackFetchedAt]);

  useEffect(() => {
    fetchData();
    if (!intervalMs || intervalMs <= 0) return;
    const timer = setInterval(fetchData, intervalMs);
    return () => clearInterval(timer);
  }, [fetchData, intervalMs]);

  return { data, dataFetchedAt, refetch: fetchData, hasAttempted };
}
