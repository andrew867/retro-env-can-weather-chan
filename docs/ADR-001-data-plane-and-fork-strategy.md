# ADR-001: Data plane, fork strategy, and display boundaries

## Status

Accepted (2026-04-07)

## Context

The channel runs as a long-lived OBS Browser Source (Chromium). Stale data and multi-day stalls were traced to:

1. A **single global `setInterval`** on the SSE route, shared across all `/weather/live` clients.
2. Client hooks using **`setInterval` without cleanup** and an **EventSource** without reconnect and with a **stale closure** on dedupe logic.

ECCC data is ingested server-side via AMQP + XML (`src/lib/eccc/conditions.ts`). Optional future MQTT ingest can supply RDS-style now-playing payloads on topics such as `rds/+/json`.

## Decision

### Parallel product line (no upstream contribution)

- This tree is a **parallel application** built on top of the original project. **`origin` is canonical** for builds and production pulls.
- There is **no plan to open pull requests or push changes upstream**. Work here is for our deployment only until the codebase is too different to meaningfully compare—at that point a clean break or rename is a natural next step.
- An optional read-only **`vendor` / `upstream` remote** (e.g. Forceh91’s repo) is only for occasional diff or cherry-pick reference, not for submission workflow.

### Data plane boundaries

- **Ingest** (ECCC AMQP, future MQTT): server-side only, writes to in-memory singletons / caches.
- **API**: Express `/api/v1/*` — REST for polling, SSE for conditions stream.
- **Display**: React + SCSS — **no visual changes** in reliability tranches unless explicitly approved; crawler remains `string[]` rendered by existing marquee.

### MQTT / now playing

- Prefer subscribing from this Node service to your broker (`rds/+/json` or station-specific), or consuming a thin WebSocket/SSE proxy if credentials must stay on another host.
- Merge metadata into init payload and/or a dedicated SSE event so the crawler can update without waiting only on a slow config poll (config poll interval is deployment-tunable).

## Consequences

- SSE implementation must be **per-connection** with disconnect cleanup (see `src/lib/eccc/sseLive.ts`).
- Contract tests live beside the helper; full-stack SSE tests may be added later with supertest.
- CasparCG “compatibility” phase 1 = same URL as OBS (HTML producer); AMCP-native templates are out of scope until explicitly scheduled.
