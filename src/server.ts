import { createStatusApp } from './api';
import { Monitor } from './types';
import { IncidentStateManager } from './incidents/IncidentStateManager';
import { ProbeRunner } from './probes/ProbeRunner';
import { WorkerPoolScheduler } from './scheduler/WorkerPoolScheduler';

const monitors = new Map<string, Monitor>();

// Seed default production probes
monitors.set('mon_payment_gateway', {
  id: 'mon_payment_gateway',
  name: 'Primary Payment Gateway API',
  type: 'HTTP',
  target: 'https://httpbin.org/status/200',
  intervalSeconds: 30,
  timeoutMs: 3000,
  consecutiveFailuresThreshold: 2,
  currentStatus: 'UP',
  consecutiveFailures: 0
});

monitors.set('mon_postgres_db', {
  id: 'mon_postgres_db',
  name: 'Aurora Primary DB Socket',
  type: 'TCP',
  target: '127.0.0.1:5432',
  intervalSeconds: 60,
  timeoutMs: 2000,
  consecutiveFailuresThreshold: 3,
  currentStatus: 'UP',
  consecutiveFailures: 0
});

const incidentManager = new IncidentStateManager();
const runner = new ProbeRunner();
const scheduler = new WorkerPoolScheduler(runner, (monitor, result) => {
  incidentManager.processProbeResult(monitor, result);
});

monitors.forEach((m) => scheduler.scheduleMonitor(m));

const app = createStatusApp(monitors, incidentManager);
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`[Vigil] Probe Engine and Status Page API running on port ${PORT}`);
});
