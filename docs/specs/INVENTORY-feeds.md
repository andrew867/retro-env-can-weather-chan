# ECCC / MSC data consumers (inventory)

| Module / router | Protocol | Feed / URL pattern |
|-----------------|----------|---------------------|
| `lib/eccc/conditions.ts` | AMQP + HTTP | Citypage XML for primary station; HTTP via `axiosGetWithMscMirror` / datamart resolve |
| `lib/eccc/alertMonitor.ts` | AMQP + HTTP | CAP XML (`*.WXO-DD.alerts.cap.#`); HTTP fetch for bootstrap |
| `lib/national/national.ts` | HTTP only | Per-station citypage via `GetWeatherFileFromECCC` |
| `lib/provincetracking/provinceTracking.ts` | HTTP only | Citypage per province station |
| `lib/usaweather/usaweather.ts` | HTTP only | NWS API + AWC METAR |
| `lib/airportMetar/airportMetar.ts` | HTTP only | AWC METAR API |
| `lib/eccc/airQuality.ts` | HTTP only | MSC HPFX AQHI observation XML (`axiosGetWithMscMirror`) |
| `lib/eccc/airQualityStations.ts` | HTTP only | AQHI XML file list (`axiosGetWithMscMirror`) |
| `lib/eccc/weatherStations.ts` | HTTP only | Station list XML (`axiosGetWithMscMirror`) |
| `lib/eccc/canadaHotColdSpot.ts` | HTTP only | Provincial hot/cold feed |
| `lib/sunspots/sunspots.ts` | HTTP only | Seasonal poll |
| `lib/eccc/historicalTempPrecip.ts` | HTTP only | Climate archive / datamart paths |

AMQP broker defaults and overrides: `mscAmqpEnv.ts`, `RWC_AMQP_*` in [OPERATORS.md](../../OPERATORS.md).
