# Phased plan: status dashboard (`/status` + `/api/v1/status`)

**Status: planned.** Intended as a quality-of-life tranche before the initial fork “wow factor” release; implement after spec/test-plan sign-off.

---

## Phase 1 — Inventory and read-only JSON

| # | Work item | Target |
|---|-----------|--------|
| **1.1** | Map each weather/auxiliary module to a **status row** (observed, forecast, national, USA, METAR, province, sunspots, alerts, seasons, AQHI, hot/cold) | `src/lib/**`, `src/routes/weather.ts` |
| **1.2** | Add **`getStatusSnapshot()`** (or similar) that aggregates **in-memory** metadata only on GET | new `src/lib/status/` or `src/lib/health/` extension |
| **1.3** | **`GET /api/v1/status`** behind **`RWC_STATUS_ENABLED`** gate + optional bearer auth | `src/routes/status.ts`, `src/routes/index.ts` |
| **1.4** | Document env + auth in **`OPERATORS.md`** | `OPERATORS.md` |

**Exit criteria:** JSON snapshot returns 200 when enabled; 404/403 when disabled; tests cover gate + minimal payload shape.

---

## Phase 2 — Refresh API

| # | Work item | Target |
|---|-----------|--------|
| **2.1** | Define **`StatusRefreshTarget`** enum aligned with existing internal refresh entry points (reuse `runConditionsFetch`, national batch, etc.) | `src/lib/status/refresh.ts` |
| **2.2** | **`POST /api/v1/status/refresh`** with validation for `scope` + `target` | `src/routes/status.ts` |
| **2.3** | Ensure refresh paths respect **circuits** and **do not** spawn unbounded parallel upstream calls | `lib/backendAxios`, existing fetch helpers |

**Exit criteria:** At least `all` and one `single` target tested; abusive repeated POSTs do not wedge the process (implementation may debounce or return 429—document choice).

---

## Phase 3 — Static UI (`status.html`)

| # | Work item | Target |
|---|-----------|--------|
| **3.1** | Add Parcel entry **`src/display/dist/status.html`** + minimal React page (or lightweight vanilla TS) | `src/display/` |
| **3.2** | Wire **`GET /status`** in **`initializeAPI`** same as `/config` | `src/api/main.ts` |
| **3.3** | UI: snapshot poll (e.g. every 5–10 s, configurable), Refresh all, per-row refresh | status bundle |
| **3.4** | Add **`yarn build:display`** step for second HTML entry if not already generic | `package.json` scripts |

**Exit criteria:** Manual smoke: open `/status`, see rows, trigger refresh, observe timestamps update without breaking main `/` display.

---

## Phase 4 — Release hygiene

| # | Work item | Target |
|---|-----------|--------|
| **4.1** | **`CHANGELOG.md`** entry under appropriate version | root changelog |
| **4.2** | Optional: Playwright smoke for `/status` 200 when enabled in test env | `playwright/` |

---

## Verification

- `yarn lint`
- `yarn test`
- Manual: `/api/v1/status` with token if configured; `/status` UI in dev

## Related docs

- [SPEC-status-dashboard.md](./SPEC-status-dashboard.md)
- [TEST-PLAN-status-dashboard.md](./TEST-PLAN-status-dashboard.md)
