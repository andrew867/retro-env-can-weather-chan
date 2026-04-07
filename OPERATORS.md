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

## Config on disk

- Main JSON: `./cfg/rwc-config.json` (created on first run).
- Crawler lines: `./cfg/crawler.txt`.

Saving from the config UI persists these files; the display picks up changes via polling `GET /init` within a few seconds.
