# Poll vs push matrix (Sarracenia Phase 2)

| Data path | Primary mechanism | HTTP fallback / poll | Notes |
|-----------|-------------------|----------------------|--------|
| Main station citypage (conditions, forecast, almanac) | MSC public AMQP `*.WXO-DD.citypage_weather.<prov>.#` → `listen()` | `GetWeatherFileFromECCC` + `axiosGetWithMscMirror` on bootstrap, on AMQP error paths, and via **stale fallback** (`RWC_CITYPAGE_STALE_*`) | Push-first; HTTP ensures recovery when broker is quiet. |
| CAP / alerts | AMQP `*.WXO-DD.alerts.cap.#` | Display polls alerts periodically (10 min) + initial fetch | Same pattern as conditions. |
| National regional temps | HTTP citypage per station (`GetWeatherFileFromECCC` + mirror) | Interval `NATIONAL_WEATHER_FETCH_INTERVAL` | No AMQP topic per regional station in this product. |
| Province tracking grid | HTTP citypage per configured station | 5 min interval | Same. |
| USA NWS + AWC METAR | HTTP `api.weather.gov` + `aviationweather.gov` | `USA_WEATHER_FETCH_INTERVAL` | Conditional GET not used (API does not expose ETag in client path). |
| Airport METAR | HTTP AWC batch API | `AIRPORT_METAR_FETCH_INTERVAL_MS` | Same AWC path as USA backup. |
| AQHI station list / config lists | HTTP MSC mirror | On-demand from config UI | Rare; uses `axiosGetWithMscMirror`. |

**Measurable reduction:** MSC mirror requests use paired HPFX/Datamart failover with **no extra waves** on terminal 4xx after both hosts are tried; retry **waves** apply to 5xx / network / 429 / 408 only (`shouldStartAnotherMscMirrorWave` in `mscHttpMirror.ts`).
