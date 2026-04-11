# Appendix — Quad-city MSC IDs (enterprise hardening)

Operator reference for **citypage `location`**, **historical bulk `historicalDataStationID`**, and **climate normals `climateID`** when aligning Winnipeg, Oakville, Hamilton, and St. John’s. Always confirm active rows in MSC inventory / pygeoapi before production; IDs can change.

| City | Citypage `location` | Historical station ID (climate.weather.gc.ca bulk) | Climate normals `CLIMATE_IDENTIFIER` |
|------|---------------------|--------------------------------------------------------|----------------------------------------|
| **Winnipeg** | `s0000193` | `3698` (example: “Winnipeg Richardson Intl A” companion row — verify CSV) | `5023222` (see `server.consts` / default config) |
| **Oakville** | `s0000367` | Use the MSC row paired with that citypage site in the ECCC inventory CSV | Pick an ID that returns **non-empty** pygeoapi CSV (Halton belt often shares Burlington-area normals) |
| **Hamilton** | `s0000549` | Same as inventory row for `s0000549` | `6153194` is a common GTA-area identifier used in prior matrices — verify |
| **St. John’s** | `NL/s0000280` (or MSC canonical without prefix if your feed uses it) | MSC historical station matching the citypage primary | MSC climate ID from 1981–2010 normals CSV for the same station family |

If **climate normals CSV** is empty, the status dashboard `climate_normals` feed includes a **note** pointing here. If **historical bulk** completes but stores no rows, see the `historical` feed **note** in the status snapshot.
