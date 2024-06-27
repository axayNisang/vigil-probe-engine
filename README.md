# Vigil Probe Engine 🛰️

[![Vigil CI](https://github.com/axayNisang/vigil-probe-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/axayNisang/vigil-probe-engine/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%20%7C%2020-green.svg)](https://nodejs.org)
[![Prometheus Ready](https://img.shields.io/badge/Prometheus-Metrics%20Ready-orange.svg)](https://prometheus.io)

**Vigil** is a high-concurrency, distributed service health monitoring engine designed for Site Reliability Engineering (SRE) and platform teams. It continuously verifies microservice availability, TLS certificate validity, and TCP network sockets with zero false-alarm flapping.

---

## 🏗 Architecture & Incident Life-Cycle

```
   [Worker Pool Scheduler]
              │
              ├───► [HTTP / HTTPS Probe] ───► Status Code & TTFB Latency
              ├───► [TCP Socket Probe]   ───► Connection & Port Reachability
              └───► [TLS Cert Monitor]   ───► Expiration Warning (< 14 Days)
                            │
                            ▼
              [Incident State Machine]
              Threshold Check (e.g. 3 consecutive failures)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
        [Status: DOWN]             [Status: UP]
               │                         │
     Trigger Webhooks            Resolve Incidents
 (Slack, Discord, PagerDuty)   Update Public Status API
```

---

## 🌟 Key Features

- **Multi-Protocol Monitoring**:
  - `HTTP / HTTPS`: Validates response status codes ($2xx / 3xx$), headers, and total roundtrip response latency.
  - `TCP`: Confirms port-level connectivity for databases, cache clusters (Redis), and raw TCP daemons.
  - `TLS_CERT`: Inspects SSL/TLS certificates and fires alerts 14 days before certificate expiration to prevent production outages.
- **Flap Prevention & Incident Thresholds**: Avoids noisy transient blips by requiring configurable consecutive probe failures before declaring an incident.
- **Public Status Page JSON API**: Aggregates 90-day SLA calculations, active incident logs, and current component statuses.
- **Prometheus `/metrics` Exporter**: Exposes native Prometheus gauges (`probe_up`, `probe_duration_seconds`) for Grafana dashboards.

---

## 🚀 Quickstart

```bash
# Clone repository
git clone https://github.com/axayNisang/vigil-probe-engine.git
cd vigil-probe-engine

# Install dependencies
npm install

# Run unit tests
npm test

# Build TypeScript
npm run build

# Start monitor engine
npm start
```

---

## 📡 API Endpoints

- `GET /api/status`: Real-time public status page summary and SLA calculation.
- `GET /metrics`: Prometheus metric exposition.
- `GET /health`: Healthcheck endpoint for container orchestrators.

---

## 📄 License
MIT License. Created by [Akshay Nisang](https://github.com/axayNisang).
