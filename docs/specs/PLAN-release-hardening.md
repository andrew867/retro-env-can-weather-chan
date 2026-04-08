# Phased plan: pre-release data hardening & reliability

**Status: 100% complete** (implementation + docs + tests). Version target was **2.6.1+**.

---

## Phase 1 — High value (ship blockers for confident broadcast)

| # | Work item | Done | Where |
|---|-----------|------|--------|
| **1.1** | Config validation at startup | Yes | `lib/config/configValidation.ts` — `validateLoadedConfigJson` on JSON parse in `config.ts`; `validateFlavourScreenIds` after flavour load in `flavour.ts`. Invalid primary location / airports / screen ids → **WARN** (server starts). Unit: `src/__tests__/configValidation.test.ts`. |
| **1.2** | Last-known-good (LKG) auxiliary feeds | Yes | `lib/reliability/lastKnownGood.ts` + `mergeNationalLkg.ts`. National / USA / airport METAR / province tracking use `rwcLkgMaxAgeMs()` (default **90 min**, `RWC_LKG_MAX_AGE_MS`). `getDataFetchedAtForHeader()` in `routeHandler.ts` uses LKG `savedAtIso` when serving cached lists. |
| **1.3** | Bounded retry + backoff | Yes | `lib/reliability/httpRetry.ts` (`axiosGetWithRetry`) for NWS + AWC. `mscHttpMirror.ts`: waves + jitter + **no extra waves** on terminal 4xx after both mirrors (`shouldStartAnotherMscMirrorWave`). Env: `RWC_HTTP_RETRY_COUNT`, `RWC_HTTP_RETRY_BACKOFF_*`. |
| **1.4** | Per-upstream circuit / cool-off | Yes | `lib/reliability/upstreamCircuit.ts`; snapshot on **`GET /api/v1/metrics`** as `upstreamCircuits`. Env: `RWC_CIRCUIT_FAILURE_THRESHOLD`, `RWC_CIRCUIT_COOL_OFF_MS`. |
| **1.5** | Health / readiness | Yes | `lib/health/readiness.ts`: **`GET /api/v1/health`** includes `degraded.citypageStale`, `degraded.upstreamCircuitCoolOff`. **`GET /api/v1/ready`** returns **503** + `reason: "citypage_data_stale"` when last citypage parse exceeds `RWC_CITYPAGE_STALE_FALLBACK_AFTER_MS`. |
| **1.6** | Operator runbook | Yes | [OPERATORS.md](../../OPERATORS.md) — env matrix, AMQP down behaviour, Datamart-first (`RWC_MSC_TRY_DATAMART_FIRST`), logs/metrics endpoints, restart order, escalation placeholder. |

**Phase 1 exit criteria:** Met — CI green (`yarn test`), items documented above.

---

## Phase 2 — Medium value (strongly recommended before wide deploy)

| # | Work item | Done | Where |
|---|-----------|------|--------|
| **2.1** | Structured upstream logging | Yes | `lib/reliability/structuredUpstreamLog.ts` on `backendAxios`; disable with `RWC_STRUCTURED_UPSTREAM_LOG=0`. Requests with `config.rwcUpstream` log `[upstream] feed=… outcome=… latencyMs=…`. |
| **2.2** | Timeout audit | Yes | Shared `backendAxios` uses `BACKEND_HTTP_TIMEOUT_MS` (`http.consts.ts`). Outbound calls go through that instance or explicit `timeout` on NWS/AWC/METAR paths. |
| **2.3** | Disk guardrails | Yes | `warnIfLowDiskFreeMib()` in `lib/storage.ts` from `server.ts` after `validateDirectories()`. Env: `RWC_MIN_DISK_FREE_MIB` (0 = off). |
| **2.4** | Post-deploy smoke | Yes | `yarn smoke` → `scripts/post-deploy-smoke.mjs` (`BASE_URL` optional). Hits `/health`, `/ready`, `/weather/observed`, `/weather/usa`, `/weather/airport-metar`. |

**Phase 2 exit criteria:** Met.

---

## Prerequisites (completed / recorded)

- [x] **T_max** for LKG: default **90 minutes** (`RWC_LKG_MAX_AGE_MS`); footer uses `X-RWC-Data-Fetched-At` from `getDataFetchedAtForHeader()` so stale auxiliary data is not mislabeled as fresh.
- [x] **Health vs ready:** **`/health`** = process + degraded flags; **`/ready`** = 503 if citypage data is stale by the same threshold as the stale HTTP fallback checker.
- [x] **Logging:** no PII in `[upstream]` lines; retries/circuits follow public API norms.

## Out of scope (unchanged)

Synthetic external probes, chaos tests on AMQP, MQTT, load tests at 12Z — post-release backlog.

## Related docs

- [CHANGELOG.md](../../CHANGELOG.md)
- [OPERATORS.md](../../OPERATORS.md)
- [POLL-vs-PUSH-matrix.md](./POLL-vs-PUSH-matrix.md)
