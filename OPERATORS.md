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

See [docs/specs/ADR-002-sarracenia-amqp-and-phase0.md](./docs/specs/ADR-002-sarracenia-amqp-and-phase0.md) for Sarracenia / Phase 0 context.

## HTTP endpoints (default API base path `/api/v1`)

| Method | Path | Notes |
| ------ | ---- | ----- |
| `GET` | `/health` | Liveness: `ok`, `service`, `uptimeSec`. |
| `GET` | `/metrics` | **Server** outbound HTTP (`backendAxios`) since process start, plus **last reported** display-bundle counters (`displayAxiosFromClient`, `displayAxiosReportedAt`) if a browser has posted to `/metrics/client`. |
| `POST` | `/metrics/client` | Body: `{ "displayAxios": { "requestCount", "successCount", "errorCount", "timeoutCount", "status4xx", "status5xx", "networkError" } }`. The display posts about every 30 seconds while `/` is open. Same auth as `GET /metrics` when `RWC_METRICS_TOKEN` is set. |
| `GET` | `/init` | Display bootstrap: flavour, crawler, `gfx`, and look-and-feel flags (including footer freshness and font mode). |

## Look and feel (config UI)

Under **Display → Look and Feel**:

- **Show footer “snapshot may be outdated” line** — toggles the bottom freshness hint independent of data age.
- **ECWC / GWCV official fonts** — default **on** (recw/GWCV webfonts). Turn **off** for the legacy consolas + ws4000 crawler stack, useful when comparing to older builds or validating upstream typography changes.

## Graphics (config UI)

Under **Graphics**:

- **`gfx.retro.reloadLineMs`** — Delay between each staggered line on forecast observation reload (default **100**, clamped **30–500**). Persisted in `rwc-config.json`; the display sets CSS `--gfx-reload-line-ms` on `#weather_channel`.
- **`gfx.retro.vhsAnalogLayerEnabled`** — Optional **broadcast analog** layer (grain + subtle bottom-band shimmer), full colour—not mono terminal. Pairs with scanlines.
- **`gfx.retro.vignetteStrength`** — Edge darkening (0–1). The vignette is drawn in a **dedicated overlay** above the 4:3 raster so it stays visible (inset shadow on the host alone sat under opaque fills). Default **0.12** in new installs; set **0** in Graphics to disable.

## Config on disk

- Main JSON: `./cfg/rwc-config.json` (created on first run).
- Crawler lines: `./cfg/crawler.txt`.

Saving from the config UI persists these files; the display picks up changes via polling `GET /init` within a few seconds.

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
