# SPEC: MQTT now-playing ingest

## Broker topics (example convention)

Many RDS-style deployments use a topic layout like:

- Pattern: `rds/+/json`
- Per-station examples: `rds/oakville/json`, `rds/hamilton/json`

Topic parsing: `rds/{station_id}/json` → `station_id` is typically lowercased on the consumer.

## Payload (minimum viable)

Decoded JSON per message; common fields:

- `artist` (string)
- `title` (string)

Optional fields often include `album`, display-friendly strings, next-track hints, and timing metadata—shape is deployment-specific.

## Weather channel integration (planned)

1. **Config**: env for broker URL, credentials, TLS, and **allowed topic prefix** or single `MQTT_STATION_ID` filter.
2. **Cache**: in-memory last message per station; optional ring buffer for debugging.
3. **Expose**:
   - Extend `GET /api/v1/init` with optional `nowPlaying` or append formatted lines to `crawler` (still `string[]` for zero UI markup change), and/or
   - New SSE event `now_playing` with the same JSON for sub-second updates.
4. **Security**: no broker creds in the browser; MQTT only on the Node server.

## Compatibility

- Prefer one shared broker with your automation stack (single source of truth).
- If this service cannot hold MQTT credentials, a **WebSocket or SSE bridge** from another backend is acceptable; the browser only talks to the weather origin over HTTP/SSE.
