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

### T4 — Reconnect / backoff (if implemented in tranche)

| ID | Case | Assert |
|----|------|--------|
| T4.1 | Simulated disconnect | Listener schedules reconnect with bounded backoff (unit-test with fake timers) |
| T4.2 | `ERR_CANCELED` / shutdown | No reconnect loop after intentional disconnect |

### T5 — Metrics / health (if implemented)

| ID | Case | Assert |
|----|------|--------|
| T5.1 | Counter or snapshot increments on connect / message / error | Snapshot test on metrics module |
| T5.2 | Health endpoint (if added) returns JSON with `amqpConnected` or equivalent | Supertest contract test |

## CI recommendation

- **Required:** `yarn test` (all unit + contract tests).
- **Optional nightly:** script `scripts/smoke-amqp-staging.sh` (document only until broker credentials available) — not blocking PR.

## Definition of done (testing)

- All T1–T3 cases implemented or explicitly deferred with issue ID in PLAN.
- No regression in existing Jest count; new files listed in this document are referenced from `package.json` test run (no extra manual steps for default CI).
