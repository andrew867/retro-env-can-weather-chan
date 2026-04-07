# Test plan: reliability / broadcast

## Automated (implemented)

| Area | File | Notes |
|------|------|--------|
| SSE helper | `src/__tests__/sseLive.test.ts` | Immediate push, interval, **two independent clients**, cleanup on `req` close |

Run: `yarn test` from `retro-env-can-weather-chan`.

## Automated (TODO)

| Area | Intent |
|------|--------|
| React hooks | `setInterval` / `clearInterval` on unmount; no duplicate pollers under StrictMode |
| `useWeatherEventStream` | Reconnect backoff; dedupe via functional `setState`; `EventSource.close` on unmount |
| Integration | supertest: two concurrent `GET /weather/live` streams both receive chunks (requires test app or mocked `conditions`) |

## Manual (OBS / Proxmox)

1. Open two Browser Sources to the same `/` URL — both should show updating conditions for 30+ minutes.
2. Refresh one source repeatedly — the other must keep updating.
3. Disconnect Wi‑Fi briefly — after restore, display recovers without full OBS restart (once client reconnect exists).

## Non-regression

- Visual snapshot: crawler, screen rotator, fonts — unchanged in reliability-focused changes.
- `yarn test` and `yarn lint` clean before deploy or mainline merge.

## Config poll interval

`useConfig` (`src/hooks/init.ts`) refreshes `/api/v1/init` on an interval so crawler/music/flavour updates apply without reloading OBS. Default is tuned for faster ops feedback; adjust the constant if load becomes an issue.
