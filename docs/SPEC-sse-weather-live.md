# SPEC: SSE — `GET /api/v1/weather/live`

## Endpoint

- **Path**: `/api/v1/weather/live` (mounted by `src/routes/weather.ts`).
- **Method**: `GET`
- **Response**: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

## Event format

- **Interval**: `CONDITIONS_EVENT_STREAM_INTERVAL` (currently 5000 ms) — see `src/consts/conditions.consts.ts`.
- **Event name**: `condition_update` (`CONDITIONS_EVENT_STREAM_CONDITION_UPDATE_EVENT`).
- **Payload**: JSON serialization of `conditions.observed()` (same shape as `GET /weather/observed`).

Each push looks like:

```http
id: <unix_ms>
event: condition_update
data: {<WeatherStation JSON>}

```

## Server semantics (normative)

1. **One TCP connection = one timer**. Opening a second browser source must **not** cancel updates to the first.
2. On client disconnect (`req`/`res` close), the timer must be **cleared** and no further writes attempted.
3. If `res.write` throws or the socket is ended, the server stops pushing for that connection.

Implementation: `attachConditionsSse` in `src/lib/eccc/sseLive.ts`.

## Client semantics (display)

- Source: `EventSource("api/v1/weather/live")` from `src/hooks/weather.ts`.
- **Future**: `onerror`, exponential backoff reconnect, functional state updates for `observationID` dedupe, `close()` on unmount.

## Optional extensions (not implemented yet)

- SSE comment heartbeat (`: ping\n\n`) for aggressive proxies.
- Additional event type e.g. `now_playing` for crawler text without changing marquee markup.
