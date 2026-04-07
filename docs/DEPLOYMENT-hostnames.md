# Deployment hostnames (DNS)

Use stable DNS names in OBS/browser sources and reverse proxies so container IPs can change without retuning clients.

| Role | Example hostname |
|------|------------------|
| Weather stack — Oakville | `mz-weather01.mz.xsa.ca` |
| Weather stack — Hamilton | `mz-weather02.mz.xsa.ca` |

Point each name at the correct VM/container IP or load balancer. TLS certificates should match these names if you serve HTTPS.

This file is operational reference only; adjust hostnames to match your environment.
