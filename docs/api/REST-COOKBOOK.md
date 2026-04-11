# REST cookbook (curl)

Replace `BASE` with your API root (e.g. `http://127.0.0.1:8600/api/v1`). Add `-H "Authorization: Bearer $TOKEN"` when **`RWC_METRICS_TOKEN`** / status token is enabled.

## Health & readiness

```bash
curl -sS "$BASE/health" | jq .
curl -sS "$BASE/ready" | jq .
```

## Display bootstrap (same payload the channel uses)

```bash
curl -sS "$BASE/init" | jq .
```

## Weather & auxiliary JSON

```bash
curl -sS "$BASE/weather/observed" | jq .
curl -sS "$BASE/weather/forecast" | jq .
curl -sS "$BASE/weather/national" | jq .
curl -sS "$BASE/weather/usa" | jq .
curl -sS "$BASE/weather/airport-metar" | jq .
curl -sS "$BASE/weather/province" | jq .
curl -sS "$BASE/weather/alerts" | jq .
curl -sS "$BASE/weather/sunspots" | jq .
curl -sS "$BASE/weather/hotColdSpots" | jq .
```

Many responses include freshness via the **`X-RWC-Data-Fetched-At`** header (exposed to browser clients via CORS).

## Full config snapshot (read)

```bash
curl -sS "$BASE/config" | jq .
```

## Crawler lines (RDS-style automation)

```bash
curl -sS -X POST "$BASE/config/crawler" \
  -H "Content-Type: application/json" \
  -d '{"crawler":["Line one","Line two"]}'
```

## Look and feel

```bash
curl -sS -X POST "$BASE/config/lookAndFeel" \
  -H "Content-Type: application/json" \
  -d '{"flavour":"default","showFooterFreshnessHint":true,"useOfficialFonts":true}'
```

## Graphics (GFX)

Send the **`gfx`** object matching your `rwc-config.json` schema (see config UI or an existing config export):

```bash
curl -sS -X POST "$BASE/config/gfx" \
  -H "Content-Type: application/json" \
  -d @gfx-patch.json
```

## Flavour (playlist) — create vs update

**Create** (`PUT` runs `saveFlavour(..., true)` so a new UUID is assigned):

```bash
curl -sS -X PUT "$BASE/flavour/" \
  -H "Content-Type: application/json" \
  -d '{"flavour":{"name":"MyRotation","screens":[{"id":1,"duration":30}]}}'
```

Use **`screen.id`** values from your build’s `Screens` enum (config UI or an exported flavour JSON).

**Update** existing flavour (same shape; `POST` overwrites the named flavour file):

```bash
curl -sS -X POST "$BASE/flavour/" \
  -H "Content-Type: application/json" \
  -d '{"flavour":{"name":"Stats","screens":[{"id":1,"duration":45}]}}'
```

**Read** one flavour by file-safe name:

```bash
curl -sS "$BASE/flavour/Stats" | jq .
```

**Delete** a flavour file (basename without `.json`). If it was the active display flavour, `rwc-config.json` switches to **`default`**:

```bash
curl -sS -X DELETE "$BASE/flavour/my_test_rotation"
```

## Operator status snapshot & refresh

```bash
curl -sS "$BASE/status" | jq .
curl -sS -X POST "$BASE/status/refresh" \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'
```

```bash
curl -sS -X POST "$BASE/status/refresh" \
  -H "Content-Type: application/json" \
  -d '{"scope":"single","target":"national"}'
```

## Metrics

```bash
curl -sS "$BASE/metrics" | jq .
curl -sS -X POST "$BASE/metrics/client" \
  -H "Content-Type: application/json" \
  -d '{"displayAxios":{"requestCount":1,"successCount":1,"errorCount":0,"timeoutCount":0,"status4xx":0,"status5xx":0,"networkError":0}}'
```

## SSE (quick test)

```bash
curl -N -H "Accept: text/event-stream" "$BASE/weather/live"
```

Press Ctrl+C to stop.
