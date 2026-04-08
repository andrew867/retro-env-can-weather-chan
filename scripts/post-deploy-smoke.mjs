#!/usr/bin/env node
/**
 * Post-deploy smoke: HTTP 200 + minimal JSON keys on critical routes.
 * Usage: BASE_URL=http://127.0.0.1:8600 node scripts/post-deploy-smoke.mjs
 */
const base = (process.env.BASE_URL || "http://127.0.0.1:8600").replace(/\/$/, "");

const paths = [
  { path: "/api/v1/health", needKeys: ["ok", "service", "mscAmqp", "degraded"] },
  { path: "/api/v1/ready", needKeys: ["ready"], allowStatus: [200, 503] },
  { path: "/api/v1/weather/observed", needKeys: [] },
  { path: "/api/v1/weather/usa", needKeys: [] },
  { path: "/api/v1/weather/airport-metar", needKeys: [] },
];

async function check() {
  for (const spec of paths) {
    const url = `${base}${spec.path}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const allowed = spec.allowStatus ?? [200];
    if (!allowed.includes(res.status)) {
      throw new Error(`${url} expected status ${allowed.join("|")}, got ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json")) {
      throw new Error(`${url} expected JSON, content-type=${ct}`);
    }
    const body = await res.json();
    for (const k of spec.needKeys) {
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
