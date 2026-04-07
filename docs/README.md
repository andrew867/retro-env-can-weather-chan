# Retro weather channel — engineering docs

Broadcast-hardening notes for the fork used with OBS / future CasparCG HTML producer.

| Document | Purpose |
|----------|---------|
| [ADR-001-data-plane-and-fork-strategy.md](./ADR-001-data-plane-and-fork-strategy.md) | Parallel line vs vendor, architecture boundaries |
| [SPEC-sse-weather-live.md](./SPEC-sse-weather-live.md) | `/api/v1/weather/live` SSE contract |
| [SPEC-mqtt-now-playing-ingest.md](./SPEC-mqtt-now-playing-ingest.md) | MQTT / RDS-style now-playing ingest (generic) |
| [DEPLOYMENT-hostnames.md](./DEPLOYMENT-hostnames.md) | Stable DNS for weather instances |
| [TEST-PLAN-reliability.md](./TEST-PLAN-reliability.md) | What we test and what is still TODO |

Lineage (read-only reference, we do not PR upstream): [Forceh91/retro-env-can-weather-chan](https://github.com/Forceh91/retro-env-can-weather-chan).
