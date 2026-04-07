# Specification: Sarracenia-aligned data ingest (major tranche)

## References

- [Sarracenia — Overview](https://metpx.github.io/sarracenia/Explanation/Overview.html) (pub/sub notifications, AMQP/MQTT, WAF trees, avoiding directory polling, reliability patterns)
- [Sarracenia — Subscriber HOWTO](https://metpx.github.io/sarracenia/How2Guides/subscriber.html) (operational subscriber configuration; use when choosing sidecar vs in-process patterns)
- MSC Datamart / HPFX HTTP mirror behavior (already implemented in `mscHttpMirror.ts`) remains the **fallback path** when push notifications are unavailable or for one-off fetches.

## Goals

1. **Reduce reliance on HTTP polling and directory listing** for “what file is newest?” problems, in line with the Overview’s emphasis on notification-driven workflows versus repeated list/filter cycles.
2. **Strengthen push-first ingest** where ECCC already publishes Sarracenia-style AMQP notifications (`v02.post` / `xpublic` — see `src/lib/amqp/sarra-canada-amqp.js`).
3. **Preserve correctness and operability**: graceful degradation to HTTP (HPFX → Datamart), clear metrics/logging, and predictable behavior under broker or network outages.
4. **Optional longer-term**: evaluate a **dedicated Sarracenia subscriber process** (e.g. `sr3` subscriber) writing into a local spool or invoking a thin IPC API, versus extending the **in-process** Node AMQP listener only—decision recorded in ADR (see PLAN).

## Non-goals (this tranche)

- Replacing all HTTP usage (e.g. `api.weather.gc.ca`, `climate.weather.gc.ca`) with Sarracenia; those remain separate products/APIs unless MSC exposes equivalent pump feeds.
- Implementing full **report message** forwarding back to source (Overview describes end-to-end tracing); may be a later phase.
- File segmentation / multi-part transfers (noted as changed in upstream v3 docs); out of scope unless we ingest very large artifacts.

## Current baseline (repository)

| Area | Mechanism |
|------|-----------|
| Citypage / conditions | AMQP subtopic + `GetWeatherFileFromECCC` HTTP when no URL from AMQP |
| CAP alerts | AMQP `*.WXO-DD.alerts.cap.#` + HTTP fetch of CAP URL |
| AMQP client | `sarra-canada-amqp.js`: `dd.weather.gc.ca:5671`, TLS, anonymous, `xpublic` exchange |

## Requirements

### R1 — Broker configuration

- Support **configurable** AMQP host (default remains aligned with MSC: `dd.weather.gc.ca` unless operations specify another pump endpoint).
- Document **heartbeat, queue expiry, reconnect/backoff** expectations consistent with “civilised participant” behavior from the Overview (no tight reconnect storms).

### R2 — Notification-first ingest

- For feeds already driven by AMQP messages (conditions, CAP), ensure the **HTTP mirror path** is clearly secondary: fetch only when message handling fails or URL is missing.
- For feeds still using **periodic HTTP only** (e.g. some lists or static docs), add a **gap analysis** item in PLAN: candidate topics or poll-vs-subscribe decision per feed.

### R3 — Observability

- Expose minimal **health signals**: AMQP connected / last message time / reconnect count (surface via existing metrics or `/api` health if present).
- Log **correlation** between AMQP notification timestamp and successful HTTP fetch (when both occur).

### R4 — Security and credentials

- Anonymous access is default for public MSC feeds; if deployment uses credentials, they must be **environment/config** only, never committed.

### R5 — Compatibility

- No breaking change to public JSON/XML shapes consumed by the display bundle unless explicitly versioned.

## Acceptance criteria (tranche)

- ADR or short design note committed: **in-process AMQP upgrade vs external `sr3` subscriber**, with trade-offs from the Overview (pub/sub efficiency, ops burden, failure isolation).
- Implemented items from PLAN phase 1 (see `PLAN-sarracenia-data-tranche.md`) with tests per `TEST-PLAN-sarracenia-data-tranche.md`.
- Operators can point to this spec + test plan from `README.md` or `OPERATORS.md` (one-line link added during implementation PR).

## Open questions

1. Does MSC document a **preferred** AMQP hostname distinct from `dd.weather.gc.ca` for production (failover pair)?
2. Should we standardize on **MQTT** for any feed where MSC exposes it, per Overview (AMQP and/or MQTT)?
3. Is a **local WAF mirror** (disk spool + sr3) required for offline replay, or is in-memory + HTTP fallback enough for this product?
