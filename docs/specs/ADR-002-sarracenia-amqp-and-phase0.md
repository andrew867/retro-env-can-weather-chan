# ADR-002: Sarracenia-aligned ingest — Phase 0 decisions

## Status

Accepted (2026-04-07)

## Context

[MetPX Sarracenia Overview](https://metpx.github.io/sarracenia/Explanation/Overview.html) describes notification-driven delivery over AMQP/MQTT and WAF trees. Environment Canada’s public MSC Datamart already exposes **Sarracenia-style AMQP notifications** (`v02.post` on exchange `xpublic`) consumed by this app via `listen()` in `src/lib/amqp/sarra-canada-amqp.js`.

Phase 0 must lock **operational configuration** (broker host/port/credentials) without hardcoding, and record how this relates to a possible future **external `sr3` subscriber** (see [PLAN-sarracenia-data-tranche.md](./PLAN-sarracenia-data-tranche.md)).

## Decision

### 1. Broker configuration (Phase 0)

- **Defaults** remain: host `dd.weather.gc.ca`, port `5671`, user/password `anonymous`, TLS enabled (existing `sarra-canada-amqp.js` behavior).
- **Overrides** use environment variables (no secrets in repo):
  - `RWC_AMQP_HOST`
  - `RWC_AMQP_PORT`
  - `RWC_AMQP_USER`
  - `RWC_AMQP_PASSWORD`
- Applied wherever `listen()` is invoked (`conditions`, `alertMonitor`) via `mscAmqpListenOptionsFromEnv()` in `src/lib/amqp/mscAmqpEnv.ts`.

### 2. Architecture choice for later phases (not implemented here)

- **Preferred next step:** keep **in-process** Node AMQP subscribers; extend observability (last message time, reconnect counts) before adding a second process.
- **Optional later:** deploy **Sarracenia `sr3` subscriber** as a sidecar writing to a local directory or calling a thin HTTP hook — only if ops require isolation from the Node event loop or disk-based replay.

### 3. HTTP mirrors (already shipped)

- HPFX primary with Datamart fallback for MSC HTTP URLs is implemented in `mscHttpMirror.ts`; AMQP remains the preferred push path for citypage and CAP URLs when available.

## Consequences

- Operators can point at another broker endpoint for tests or redundancy without code changes.
- Full “data pump” parity with [Subscriber HOWTO](https://metpx.github.io/sarracenia/How2Guides/subscriber.html) remains a **Phase 2+** item if we adopt `sr3` configs.
