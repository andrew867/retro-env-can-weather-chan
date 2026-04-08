# Operator guide (deployed instances)

This document is for people running the Retro ECCC Weather Channel simulator in production or on a headless box (for example `mz-weather01`). End-user setup remains in [README.md](./README.md).

## Git and `yarn.lock` on the server

If `git status` shows only **`yarn.lock` modified** after `git pull` reports “Already up to date,” the **code matches the remote**; the difference is usually local resolution from `yarn install` (Yarn version, platform, or lockfile drift). Either:

- Discard the local lockfile change: `git restore yarn.lock`, then `yarn install` if needed, or  
- Commit and push the lockfile from a dev machine if you intentionally changed dependencies.

A dirty `yarn.lock` does **not** by itself mean the server missed pushed commits—compare `git log -1` with your canonical remote.

## Environment

| Variable | Purpose |
| -------- | ------- |
| **`RWC_METRICS_TOKEN`** | If set, **`GET /api/v1/metrics`** and **`POST /api/v1/metrics/client`** require `Authorization: Bearer <token>`. Omit for same-host-only or trusted networks. |
| **`RWC_AMQP_HOST`** | Optional. MSC Datamart AMQP broker hostname (default **`dd.weather.gc.ca`**). Used by citypage and CAP `listen()` subscribers. |
| **`RWC_AMQP_PORT`** | Optional. AMQP port (default **5671**, TLS). |
| **`RWC_AMQP_USER`** | Optional. AMQP login (default **`anonymous`**). |
| **`RWC_AMQP_PASSWORD`** | Optional. AMQP password (default **`anonymous`**). |
| **`RWC_MSC_TRY_DATAMART_FIRST`** | Set to **`1`** to try **`dd.weather.gc.ca`** before **`hpfx.collab.science.gc.ca`** for MSC mirror pairs (helps when HPFX TLS fails locally but Datamart works). Default: HPFX first. |
| **`RWC_CITYPAGE_STALE_FALLBACK_AFTER_MS`** | Optional. If the **last successful citypage parse** is older than this many milliseconds, the server runs a **datamart-backed HTTP fetch** on the next check (same path as startup), even when MSC AMQP has been silent. Default **7200000** (2 hours). Minimum enforced **300000** (5 minutes). |
| **`RWC_CITYPAGE_STALE_FALLBACK_CHECK_MS`** | Optional. How often to evaluate the threshold above (milliseconds). Default **900000** (15 minutes). Minimum **60000** (1 minute), maximum **86400000** (24 hours). |
| **`RWC_CITYPAGE_STALE_FALLBACK_DISABLED`** | Set to **`1`** to turn off the periodic stale check entirely (rely on AMQP + the initial bootstrap fetch only). |
| **`RWC_AMQP_RECONNECT_LIMIT_MS`** | Optional. Max backoff cap (ms) passed to the `amqp` client as `reconnectExponentialLimit` (default in listener code: **120000**). |
| **`RWC_LKG_MAX_AGE_MS`** | Max age for in-memory **last-known-good** snapshots for national / USA / airport METAR / province tracking when upstream fails (default **5400000** ms = 90 min). |
| **`RWC_HTTP_RETRY_COUNT`** | Extra **waves** for idempotent GET retries (NWS, AWC, MSC mirror outer loop). Default **2** (total attempts = 1 + this for single-URL helpers; MSC mirror also tries HPFX + Datamart per wave). Max **5**. |
| **`RWC_HTTP_RETRY_BACKOFF_MIN_MS`** / **`RWC_HTTP_RETRY_BACKOFF_MAX_MS`** | Jittered backoff between retry waves (defaults **100** / **2000**). |
| **`RWC_CIRCUIT_FAILURE_THRESHOLD`** | Consecutive failures before a host enters cool-off (default **5**, clamped 2–20). |
| **`RWC_CIRCUIT_COOL_OFF_MS`** | Cool-off duration (default **120000** ms). |
| **`RWC_MIN_DISK_FREE_MIB`** | If set **> 0** and Node provides `fs.statfsSync`, emit one **WARN** at startup when free space is below this many MiB. **0** = disabled. |
| **`RWC_STRUCTURED_UPSTREAM_LOG`** | Set to **`0`** to disable `[upstream]` structured lines on `backendAxios`. |
| **`RWC_METRICS_DISABLED`** | Set to **`1`** to disable **`GET /api/v1/metrics`** (returns 404 JSON) while leaving **`/health`** available. |

See [docs/specs/ADR-002-sarracenia-amqp-and-phase0.md](./docs/specs/ADR-002-sarracenia-amqp-and-phase0.md) for Sarracenia / Phase 0 context.

### Reliability runbook (short)

- **AMQP down:** Citypage and CAP still recover via HTTP — bootstrap fetch on startup, **stale fallback** on a timer (`RWC_CITYPAGE_STALE_*`), and alert HTTP poll in the display bundle. Check firewall **5671/tcp** to `RWC_AMQP_HOST`.
- **HPFX TLS issues:** Set **`RWC_MSC_TRY_DATAMART_FIRST=1`** so **`dd.weather.gc.ca`** is tried before **`hpfx.collab.science.gc.ca`** for MSC mirror pairs.
- **Logs:** Logger categories include `upstream` (structured lines), `CONFIG` (validation), `Storage` (disk warn). No tokens or passwords are logged.
- **Metrics / circuits:** `GET /api/v1/metrics` includes **`upstreamCircuits`** (per-host cool-off state). **`GET /api/v1/health`** includes **`degraded`** flags; **`GET /api/v1/ready`** returns **503** if the last successful **citypage parse** is older than **`RWC_CITYPAGE_STALE_FALLBACK_AFTER_MS`** (same bar as the internal stale checker).
- **Restart order:** Start API (`yarn start` or process manager) after config under `./cfg/` exists; run **`yarn smoke`** (or `node scripts/post-deploy-smoke.mjs`) against `BASE_URL` after deploy.
- **Escalation:** *On-call / owner — set per deployment.*

**Citypage ingest:** Under normal operation, new XML is fetched when MSC public AMQP announces your station’s citypage file. If the broker delivers nothing for a long time (firewall change, client bug, or rare MSC gaps), the stale fallback above still pulls the current file from HTTP mirrors so the display and SSE clients can update. The browser also refetches other feeds on **`/weather/live`** reconnect; CAP/alerts additionally use a **10-minute** HTTP poll fallback in the display bundle.

## HTTP endpoints (default API base path `/api/v1`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/health` | Liveness: `ok`, `service`, `uptimeSec`, **`mscAmqp`**, **`degraded`** (`citypageStale`, `upstreamCircuitCoolOff`). |
| `GET` | `/ready` | Readiness: **503** + `reason: "citypage_data_stale"` when the last successful citypage parse is older than the stale threshold (same semantics as the periodic stale HTTP fallback). Includes `degraded` + `mscAmqp` snapshot. |
| `GET` | `/metrics` | Same **`mscAmqp`** as health, **`upstreamCircuits`**, plus **server** outbound HTTP (`backendAxios`) since process start, and **last reported** display-bundle counters (`displayAxiosFromClient`, `displayAxiosReportedAt`) if a browser has posted to `/metrics/client`. Disabled when **`RWC_METRICS_DISABLED=1`**. |
| `POST` | `/metrics/client` | Body: `{ "displayAxios": { "requestCount", "successCount", "errorCount", "timeoutCount", "status4xx", "status5xx", "networkError" } }`. The display posts about every 30 seconds while `/` is open. Same auth as `GET /metrics` when `RWC_METRICS_TOKEN` is set. |
| `GET` | `/init` | Display bootstrap: flavour, crawler, `gfx`, and look-and-feel flags (including footer freshness and font mode). |

## Look and feel (config UI)

Under **Display → Look and Feel**:

- **Show footer “snapshot may be outdated” line** — toggles the bottom freshness hint independent of data age.
- **ECWC / GWCV official fonts** — default **on** (recw/GWCV webfonts). Turn **off** for the legacy consolas + ws4000 crawler stack, useful when comparing to older builds or validating upstream typography changes.

## Graphics (config UI)

**Default on-air preset (new installs):** authentic refresh **on** (100 cps, 120 ms clear, 12 ms jitter), next-gen layers **on**, SD **4:3**, reload line **100** ms, VHS-style analog **on**, scanlines **~0.07**, vignette **0.12**, colour preset **none**. Tune or disable under **Graphics**; RDS/automation that only hits **`POST /api/v1/config/crawler`** does not touch these flags.

Under **Graphics**:

- **`gfx.retro.reloadLineMs`** — Delay between each staggered line on forecast observation reload (default **100**, clamped **30–500**). Persisted in `rwc-config.json`; the display sets CSS `--gfx-reload-line-ms` on `#weather_channel`.
- **`gfx.retro.vhsAnalogLayerEnabled`** — Optional **broadcast analog** layer (grain + subtle bottom-band shimmer), full colour—not mono terminal. Pairs with scanlines.
- **`gfx.retro.vignetteStrength`** — Edge darkening (0–1). The vignette is drawn in a **dedicated overlay** above the 4:3 raster so it stays visible (inset shadow on the host alone sat under opaque fills). Default **0.12** in new installs; set **0** in Graphics to disable.

## Config on disk

- Main JSON: `./cfg/rwc-config.json` (created on first run).
- Crawler lines: `./cfg/crawler.txt`.

Saving from the config UI persists these files; the display picks up changes via `GET /init` (slow poll) and **immediately** for crawler lines via **`GET /init/stream`** (SSE `crawler_update` after `POST /api/v1/config/crawler`).

## Publishing to the public GitHub fork (from a private monorepo)

If this app lives inside a larger private repository and you mirror **only** this directory to a public fork (for example `retro-env-can-weather-chan` on GitHub), use a **subtree split** from the monorepo root so prod can keep using `git pull` on the fork.

One-time: add a remote for the fork (SSH or HTTPS):

```bash
git remote add github git@github.com:YOUR_USER/retro-env-can-weather-chan.git
```

Publish the subtree branch and push:

```bash
# Run from the monorepo repository root (not inside this folder).
git subtree split --prefix=code/weather-gfx/retro-env-can-weather-chan -b rwc-github-publish
git push github rwc-github-publish:main --force-with-lease
git branch -D rwc-github-publish
```

Keep **internal product names and private hostnames** out of commits that go to the public fork; use neutral operator wording in docs and config UI copy.
