import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Optional metadata for structured upstream logs (`[upstream]` lines). No secrets. */
    rwcUpstream?: { feed: string; key?: string };
  }
}
