# Test plan: status dashboard

## Principles

- **Security first:** disabled by default in production configuration; token gate matches metrics when enabled.
- **No upstream calls on GET:** snapshot is read-only aggregation unless explicitly documented otherwise.
- **Refresh is explicit:** POST only; tests mock or stub upstream HTTP.

## Existing checks to preserve

- `yarn lint`
- `yarn test`

---

## T1 — Feature gate and auth

| ID | Case | Setup | Assert |
|----|------|-------|--------|
| T1.1 | Disabled | `RWC_STATUS_ENABLED` unset / `0`, `NODE_ENV=production` (or documented prod rule) | `GET /api/v1/status` → **404** or **403** (per spec) |
| T1.2 | Enabled | `RWC_STATUS_ENABLED=1` | `GET /api/v1/status` → **200**, JSON has `statusSchemaVersion` |
| T1.3 | Token | `RWC_METRICS_TOKEN` or `RWC_STATUS_TOKEN` set | Request without `Authorization` → **401**; with `Bearer` → **200** |

---

## T2 — Snapshot shape

| ID | Case | Assert |
|----|------|--------|
| T2.1 | Root keys | Response includes `statusSchemaVersion`, `server`, and `feeds` (or equivalent nested structure) |
| T2.2 | Citypage row | Primary conditions block includes `fetchedAt` or `observationID` when data exists |
| T2.3 | Stable JSON | Two consecutive GETs without mutations return same logical snapshot (timestamps may differ only if wall-clock fields included—document) |

---

## T3 — Refresh API

| ID | Case | Body | Assert |
|----|------|------|--------|
| T3.1 | Refresh all | `{ "scope": "all" }` | **202** or **200** per implementation; internal refresh scheduler invoked (mock) |
| T3.2 | Single target | `{ "scope": "single", "target": "usa" }` | USA refresh path invoked once |
| T3.3 | Invalid target | `{ "scope": "single", "target": "nope" }` | **400** with clear JSON error |
| T3.4 | Gate | Status disabled | POST also rejected |

---

## T4 — Static page (Phase 3)

| ID | Case | Assert |
|----|------|--------|
| T4.1 | Build | `yarn build:display` emits `dist/status.html` and JS bundle |
| T4.2 | Route | `GET /status` serves HTML when server running (manual or Playwright) |
| T4.3 | Disabled UI | When API disabled, page shows explanatory banner, no uncaught fetch errors |

---

## T5 — Client payload rows (SPEC R7)

| ID | Case | Assert |
|----|------|--------|
| T5.1 | Expand row | Lazy `GET` to display-equivalent paths; pretty-printed JSON visible |
| T5.2 | Auth | With bearer gate, session token allows payload fetch |

---

## Manual smoke checklist

1. Enable status in dev, open `/status`, confirm all expected feed rows appear.
2. Click **Refresh all**, confirm timestamps or `fetchedAt` headers move forward when upstream succeeds.
3. Trigger **single** refresh on a heavy feed (e.g. national) and confirm no duplicate storm of requests in logs beyond documented behaviour.
4. Enable token, confirm browser fetch fails without token and works with dev proxy or manual header injection.
5. Expand **Payload** on a row; confirm JSON matches `GET /api/v1/weather/…` (or equivalent) in Network tab.

## Definition of done

- T1–T3 satisfied in CI
- T4 satisfied when UI lands
- `OPERATORS.md` updated
- [CHANGELOG.md](../../CHANGELOG.md) updated for the release that ships the feature

## Related docs

- [SPEC-status-dashboard.md](./SPEC-status-dashboard.md)
- [PLAN-status-dashboard.md](./PLAN-status-dashboard.md)
