#!/usr/bin/env node
/**
 * Post-deploy smoke: HTTP + minimal JSON checks on critical routes.
 * Usage: BASE_URL=http://127.0.0.1:8600 node scripts/post-deploy-smoke.mjs
 *
 * Optional: METRICS_TOKEN=bearer-token — sent as Authorization for /metrics when your deploy uses RWC_METRICS_TOKEN.
 */
const base = (process.env.BASE_URL || "http://127.0.0.1:8600").replace(/\/$/, "");
const metricsAuth =
  process.env.METRICS_TOKEN?.trim()?.length > 0
    ? { Authorization: `Bearer ${process.env.METRICS_TOKEN.trim()}` }
    : {};

/**
 * @typedef {{ path: string, needKeys?: string[], allowStatus?: number[], headers?: Record<string,string>, validate?: (res: Response, body: unknown) => void }} SmokeSpec
 */

/** @type {SmokeSpec[]} */
const paths = [
  { path: "/api/v1/health", needKeys: ["ok", "service", "mscAmqp", "degraded"] },
  { path: "/api/v1/ready", needKeys: ["ready"], allowStatus: [200, 503] },
  { path: "/api/v1/weather/observed", needKeys: [] },
  { path: "/api/v1/weather/usa", needKeys: [] },
  { path: "/api/v1/weather/airport-metar", needKeys: [] },
  {
    path: "/api/v1/init",
    needKeys: ["config", "gfx", "authenticRefresh", "crawler", "flavour", "music", "infoScreen"],
  },
  {
    path: "/api/v1/metrics",
    allowStatus: [200, 401, 404],
    headers: { ...metricsAuth },
    validate(res, body) {
      const o = body && typeof body === "object" ? /** @type {Record<string, unknown>} */ (body) : {};
      if (res.status === 200) {
        for (const k of ["backendAxios", "mscAmqp", "upstreamCircuits", "since"]) {
          if (!(k in o)) {
            throw new Error(`/api/v1/metrics missing key "${k}"`);
          }
        }
        return;
      }
      if (res.status === 401) {
        if (typeof o.error !== "string") {
          throw new Error("/api/v1/metrics 401 expected { error: string }");
        }
        return;
      }
      if (res.status === 404) {
        if (typeof o.error !== "string") {
          throw new Error("/api/v1/metrics 404 expected { error: string } (metrics_disabled or similar)");
        }
        return;
      }
    },
  },
  {
    path: "/api/v1/status",
    allowStatus: [200, 401, 404],
    validate(res, body) {
      const o = body && typeof body === "object" ? /** @type {Record<string, unknown>} */ (body) : {};
      if (res.status === 200) {
        if (!("statusSchemaVersion" in o)) {
          throw new Error("/api/v1/status missing statusSchemaVersion");
        }
        return;
      }
      if (res.status === 401) {
        if (typeof o.error !== "string") {
          throw new Error("/api/v1/status 401 expected { error: string }");
        }
        return;
      }
      if (res.status === 404) {
        if (typeof o.error !== "string") {
          throw new Error("/api/v1/status 404 expected JSON error (e.g. status_disabled)");
        }
        return;
      }
    },
  },
];

async function check() {
  for (const spec of paths) {
    const url = `${base}${spec.path}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...spec.headers },
    });
    const allowed = spec.allowStatus ?? [200];
    if (!allowed.includes(res.status)) {
      throw new Error(`${url} expected status ${allowed.join("|")}, got ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) {
      throw new Error(`${url} expected JSON, content-type=${ct}`);
    }
    const body = await res.json();
    if (typeof spec.validate === "function") {
      spec.validate(res, body);
    }
    const keys = spec.needKeys ?? [];
    for (const k of keys) {
      if (!(k in body)) {
        throw new Error(`${url} missing key "${k}" in ${JSON.stringify(body).slice(0, 200)}`);
      }
    }
  }
  console.log("post-deploy-smoke: ok", base);
}

check().catch((err) => {
  console.error("post-deploy-smoke: failed", err.message || err);
  process.exit(1);
});
