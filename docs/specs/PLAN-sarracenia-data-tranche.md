# Implementation plan: Sarracenia-aligned data ingest (tranches)

This plan translates [SPEC-sarracenia-data-tranche.md](./SPEC-sarracenia-data-tranche.md) into phased work, grounded in the [Sarracenia Overview](https://metpx.github.io/sarracenia/Explanation/Overview.html) (notification-driven distribution, AMQP/MQTT, reliability, WAF-oriented workflows).

## Phase 0 — Discovery (1–2 days)

**Status:** **ADR complete** — see [ADR-002-sarracenia-amqp-and-phase0.md](./ADR-002-sarracenia-amqp-and-phase0.md) (broker env overrides + Phase 1 direction). Optional inventory table of feed types can still be added later.

**Deliverables**

- ~~Inventory table~~: each ECCC data consumer in `src/lib/eccc/` and related routers → **AMQP today / HTTP only / mixed**. (Deferred; HTTP mirror + HPFX already documented.)
- Read MSC/ECCC operator notes for AMQP endpoints and topic conventions (confirm `dd.weather.gc.ca:5671` vs alternatives).
- Decision memo (short ADR in `docs/` or extend `ADR-001`): **Option A** extend in-process `sarra-canada-amqp.js` + TypeScript wrappers vs **Option B** deploy `sr3` subscriber sidecar + file drop or HTTP callback.

**Exit criteria:** Signed-off choice for Phase 1 implementation path; open questions from SPEC answered or flagged.

## Phase 1 — Harden in-process push path (recommended first)

**Scope**

- Config: environment-driven `AMQP_HOST`, `AMQP_PORT`, `AMQP_SUBTOPIC_*` for conditions and alerts (avoid hardcoding in call sites).
- Listener: verify reconnect behavior matches Overview expectations (exponential backoff, no tight loops); add tests per [TEST-PLAN](./TEST-PLAN-sarracenia-data-tranche.md) T4 if gaps found.
- Metrics: minimal counters for connect / disconnect / last message time (T5).
- Documentation: `OPERATORS.md` subsection — broker URL, firewall (5671 TCP), and fallback to HTTP mirrors.

**Exit criteria:** Phase 1 items in SPEC marked met; CI green; operators can change broker host without code edit.

## Phase 2 — Reduce remaining HTTP polling

**Scope**

- For each **HTTP-only** periodic fetch identified in Phase 0, either:
  - Subscribe to an AMQP topic that announces those files (if MSC publishes), or
  - Keep HTTP but increase interval and use **conditional** requests if headers/ETag supported, or
  - Document why polling must remain.
- Align fetches with **HPFX primary / Datamart fallback** consistently (already centralized in `mscHttpMirror.ts`).

**Exit criteria:** Documented “poll vs push” matrix; measurable reduction in redundant directory GETs where applicable.

## Phase 3 — Optional external Sarracenia subscriber

**Scope** (only if Phase 0 chose Option B or hybrid)

- Package `sr3` (or distro packages) with config from [Subscriber HOWTO](https://metpx.github.io/sarracenia/How2Guides/subscriber.html).
- Local WAF or spool directory; Node process watches directory or receives webhook — **single ingestion path** to avoid duplicate processing.
- Deployment: systemd units, logging, disk bounds.

**Exit criteria:** Staging deployment receives files without duplicate AMQP connections from Node; rollback path documented.

## Phase 4 — Follow-ups (backlog)

- Report messages / end-to-end tracing (Overview feature) — only if product needs provenance.
- MQTT parallel to AMQP for specific feeds if MSC exposes and ops prefer it.
- Load testing during simulated MSC high-load windows (12Z).

## Dependencies

- **Blocked by:** none for Phase 1 (code-only).
- **Requires ops:** firewall rules, optional credentials, staging broker access for optional integration tests.

## Ready-to-proceed checklist

Use this before starting Phase 1 coding:

- [ ] Phase 0 inventory + ADR drafted
- [ ] Broker default/override agreed with operations
- [ ] TEST-PLAN T1–T3 mapped to concrete files/functions
- [ ] Rollback: feature flag or env to disable new metrics if needed (optional)

When the above are checked, **proceed with Phase 1** implementation in the repo.
