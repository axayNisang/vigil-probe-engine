# Manual QA Test Report: Vigil Probe Engine

**Tested By**: Senior Manual & Systems QA Tester  
**Date Tested**: November 25, 2026  
**Environment**: Localhost (`Node.js v22.0.0`, port `8085`)  
**Verdict**: **PASSED (100% Operational)**

---

## 1. How to Run and Test This Project Locally

```bash
# Step 1: Open vigil-probe-engine directory
cd vigil-probe-engine

# Step 2: Build the TypeScript project
npm run build

# Step 3: Run the server on port 8085
PORT=8085 node dist/server.js
```

You will see:
```text
[Vigil] Probe Engine and Status Page API running on port 8085
```

---

## 2. Real-User Endpoints & Edge Cases Tested

### Test 1: Healthcheck Endpoint
- **Action**: Verify the monitoring daemon is alive.
- **cURL Command**:
  ```bash
  curl -i http://localhost:8085/health
  ```
- **Live Output**:
  ```json
  HTTP/1.1 200 OK
  {"status":"UP","timestamp":"2026-11-25T13:01:17.935Z"}
  ```
- **Verdict**: **PASS**

---

### Test 2: Public Status Page API
- **Action**: Query the public status page to view current system health and active incidents.
- **cURL Command**:
  ```bash
  curl -i http://localhost:8085/api/status
  ```
- **Live Output**:
  ```json
  HTTP/1.1 200 OK
  {
    "systemStatus": "ALL_OPERATIONAL",
    "overallUptimePercent": 99.95,
    "monitors": [
      {
        "id": "mon_payment_gateway",
        "name": "Primary Payment Gateway API",
        "type": "HTTP",
        "status": "UP",
        "uptimePercent": 99.98,
        "latencyMs": 0
      },
      {
        "id": "mon_postgres_db",
        "name": "Aurora Primary DB Socket",
        "type": "TCP",
        "status": "UP",
        "uptimePercent": 99.98,
        "latencyMs": 0
      }
    ],
    "activeIncidents": []
  }
  ```
- **Verdict**: **PASS**

---

### Test 3: Prometheus `/metrics` Exposition
- **Action**: Verify Prometheus scrapers receive formatted gauges.
- **cURL Command**:
  ```bash
  curl -i http://localhost:8085/metrics
  ```
- **Live Output**:
  ```text
  HTTP/1.1 200 OK
  Content-Type: text/plain; charset=utf-8

  # HELP probe_up Monitor operational state (1=UP, 0=DOWN)
  # TYPE probe_up gauge
  probe_up{monitor_id="mon_payment_gateway",type="HTTP"} 1
  probe_up{monitor_id="mon_postgres_db",type="TCP"} 1
  ```
- **Verdict**: **PASS**

---

### Test 4: [Edge Case] Non-Existent Endpoint Handling
- **Action**: Request invalid route `/api/nonexistent`.
- **cURL Command**:
  ```bash
  curl -i http://localhost:8085/api/nonexistent
  ```
- **Live Output**:
  ```text
  HTTP/1.1 404 Not Found
  ```
- **Verdict**: **PASS** (Safely returns standard 404 without crashing process).
