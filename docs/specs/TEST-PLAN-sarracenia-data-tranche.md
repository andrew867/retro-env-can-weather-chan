# Test plan: Sarracenia-aligned data ingest tranche

## Principles

- **Unit tests** mock AMQP and HTTP; no live broker in CI.
- **Contract tests** assert wire shapes and handler behavior (topics, URL extraction, fallback order).
- **Integration / manual** tests documented for staging with real broker (optional CI job).

## Existing coverage to preserve

- `mscHttpMirror` URL ordering (HPFX → Datamart) — `src/__tests__/mscHttpMirror.test.ts`
- Conditions / alert flows that use `listen()` from `sarra-canada-amqp.js` — keep mocks in `__tests__/mocks.ts` and related suites stable when refactoring AMQP glue.

## New / updated test categories

### T1 — AMQP listener configuration

| ID | Case | Assert |
|----|------|--------|
| T1.1 | Default broker host/port when env unset | Matches documented default (see spec) |
| T1.2 | Override via config/env | `listen()` receives custom `amqp_host` / `amqp_subtopic` |
| T1.3 | SSL enabled | Connection options include TLS (existing behavior locked by test) |

**Implementation note:** If `listen` stays in JS, add Jest tests that import the module with `amqp` mocked to capture connection config; avoid real sockets.

### T2 — Message → fetch correlation

| ID | Case | Assert |
|----|------|--------|
| T2.1 | Conditions: message with matching station URL triggers `backendAxios`/`axiosGetWithMscMirror` with that URL | Request URL passes mirror helper |
| T2.2 | Alert monitor: CAP URL from message uses mirror helper | Same |
| T2.3 | Malformed message does not crash listener | Error logged, no unhandled rejection |

### T3 — Fallback when push fails

| ID | Case | Assert |
|----|------|--------|
| T3.1 | No AMQP message: datamart resolver still returns a URL when directories exist | Existing datamart tests + integration with mirror |
| T3.2 | HTTP 404 on HPFX then success on Datamart | Covered by `axiosGetWithMscMirror` retry policy + moxios |

### T4 — Reconnect / backoff

| ID | Case | Assert |
|----|------|--------|
| T4.1 | `listen()` passes exponential reconnect options to `amqp.createConnection` | `src/__tests__/sarraAmqpListen.test.ts` (mocked `amqp`) |
| T4.2 | `RWC_AMQP_RECONNECT_LIMIT_MS` → `amqp_reconnect_limit_ms` | `src/__tests__/mscAmqpEnv.test.ts` |

### T5 — Metrics / health

| ID | Case | Assert |
|----|------|--------|
| T5.1 | MSC AMQP + `upstreamCircuits` in metrics snapshot | `src/__tests__/mscAmqpStats.test.ts`, `lib/upstreamMetrics.ts` |
| T5.2 | Health includes `degraded` flags | `lib/health/readiness.ts`, `GET /api/v1/health` |
| T5.3 | Readiness endpoint | `GET /api/v1/ready` (503 when citypage stale per `citypageStaleFallback`) |

## CI recommendation

- **Required:** `yarn test` (all unit + contract tests).
- **Optional nightly:** script `scripts/smoke-amqp-staging.sh` (document only until broker credentials available) — not blocking PR.

## Definition of done (testing)

- T1–T5 cases implemented or explicitly covered in PLAN; see [PLAN-sarracenia-data-tranche.md](./PLAN-sarracenia-data-tranche.md).
- No regression in existing Jest count; new files listed in this document are referenced from `package.json` test run (no extra manual steps for default CI).
