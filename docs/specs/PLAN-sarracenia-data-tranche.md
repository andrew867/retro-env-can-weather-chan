# Implementation plan: Sarracenia-aligned data ingest (tranches)

**Status: 100% complete** for Phases 0–2 and rollout prerequisites in this repo. **Phase 3** (external `sr3` sidecar) remains **out of product scope** for this codebase — Option A (in-process `listen()` + HTTP mirrors) is the shipped architecture; see [ADR-002](./ADR-002-sarracenia-amqp-and-phase0.md).

---

## Phase 0 — Discovery

**Status:** Complete.

| Deliverable | Result |
|-------------|--------|
| Inventory of HTTP vs AMQP consumers | [INVENTORY-feeds.md](./INVENTORY-feeds.md) |
| MSC broker notes | Documented in ADR-002 + OPERATORS (`RWC_AMQP_*`) |
| Option A vs B | **Option A** chosen and implemented (`sarra-canada-amqp.js` + TS callers) |

---

## Phase 1 — Harden in-process push path

**Status:** Complete.

| Item | Result |
|------|--------|
| Env-driven broker | `mscAmqpListenOptionsFromEnv()` — `RWC_AMQP_HOST`, `PORT`, `USER`, `PASSWORD`, **`RWC_AMQP_RECONNECT_LIMIT_MS`** |
| Reconnect / backoff | `amqp` client options: `reconnectBackoffStrategy: "exponential"`, `reconnectExponentialLimit` (default **120000** ms, overridable). Tests: `sarraAmqpListen.test.ts`, `mscAmqpEnv.test.ts` |
| Metrics | `mscAmqpStats` + **`upstreamCircuits`** on `GET /api/v1/metrics` |
| Documentation | [OPERATORS.md](../../OPERATORS.md) — broker, firewall **5671/TCP**, HTTP fallback |
| Metrics rollback | `RWC_METRICS_DISABLED=1` → `GET /metrics` returns **404** with `{ error: "metrics_disabled" }` |

---

## Phase 2 — Reduce remaining HTTP polling

**Status:** Complete.

| Item | Result |
|------|--------|
| Poll vs push matrix | [POLL-vs-PUSH-matrix.md](./POLL-vs-PUSH-matrix.md) |
| MSC mirror alignment | Centralized `axiosGetWithMscMirror` / HEAD variants; wave retry only when `shouldStartAnotherMscMirrorWave` (5xx / network / 429 / 408), not after terminal 4xx from both mirrors |

---

## Phase 3 — Optional external Sarracenia subscriber

**Status:** **Not implemented** in this repository by design (no duplicate ingestion path). If ops later deploy `sr3`, use MSC’s subscriber HOWTO and a **single** delivery path into this app (file drop or callback) — do not run a second AMQP consumer for the same topics without coordination.

---

## Phase 4 — Follow-ups (backlog)

Unchanged: report messages / MQTT / load tests — future work.

---

## Dependencies

- **Blocked by:** none for shipped Phases 1–2.
- **Requires ops:** firewall, optional broker credentials, staging broker for manual validation.

## Ready-to-proceed checklist

- [x] Phase 0 + ADR ([ADR-002](./ADR-002-sarracenia-amqp-and-phase0.md))
- [x] Broker overrides (`mscAmqpEnv.ts` + OPERATORS)
- [x] TEST-PLAN T1–T5 mapped ([TEST-PLAN-sarracenia-data-tranche.md](./TEST-PLAN-sarracenia-data-tranche.md))
- [x] Metrics disable env (`RWC_METRICS_DISABLED`)

**Tests:** `yarn test`; **smoke:** `yarn smoke` against a running instance.
