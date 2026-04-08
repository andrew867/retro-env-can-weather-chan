import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import Logger from "lib/logger";

const logger = new Logger("upstream");

function classifyOutcome(err: unknown): "timeout" | "4xx" | "5xx" | "network" | "cancel" | "unknown" {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError;
    if (e.code === "ERR_CANCELED") return "cancel";
    if (e.code === "ECONNABORTED" || e.message?.toLowerCase().includes("timeout")) return "timeout";
    const s = e.response?.status;
    if (s != null) {
      if (s >= 500) return "5xx";
      if (s >= 400) return "4xx";
    }
    return "network";
  }
  return "unknown";
}

function isStructuredLogDisabled(): boolean {
  return process.env.RWC_STRUCTURED_UPSTREAM_LOG === "0";
}

/** Attaches request/response logging for requests that set `config.rwcUpstream`. */
export function attachStructuredUpstreamLogging(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    (config as InternalAxiosRequestConfig & { __rwcT0?: number }).__rwcT0 = Date.now();
    return config;
  });

  client.interceptors.response.use(
    (res: AxiosResponse) => {
      const cfg = res.config as InternalAxiosRequestConfig & { __rwcT0?: number; rwcUpstream?: { feed: string; key?: string } };
      if (isStructuredLogDisabled() || !cfg.rwcUpstream) return res;
      const latencyMs = cfg.__rwcT0 != null ? Date.now() - cfg.__rwcT0 : -1;
      const key = cfg.rwcUpstream.key != null ? ` key=${cfg.rwcUpstream.key}` : "";
      logger.log(`[upstream] feed=${cfg.rwcUpstream.feed}${key} outcome=ok latencyMs=${latencyMs}`);
      return res;
    },
    (err: unknown) => {
      const cfg = axios.isAxiosError(err) ? (err.config as (InternalAxiosRequestConfig & { __rwcT0?: number; rwcUpstream?: { feed: string; key?: string } }) | undefined) : undefined;
      if (!isStructuredLogDisabled() && cfg?.rwcUpstream) {
        const latencyMs = cfg.__rwcT0 != null ? Date.now() - cfg.__rwcT0 : -1;
        const key = cfg.rwcUpstream.key != null ? ` key=${cfg.rwcUpstream.key}` : "";
        const outcome = classifyOutcome(err);
        logger.log(`[upstream] feed=${cfg.rwcUpstream.feed}${key} outcome=${outcome} latencyMs=${latencyMs}`);
      }
      return Promise.reject(err);
    }
  );
}
