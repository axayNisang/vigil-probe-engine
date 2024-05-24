import express, { Request, Response } from 'express';
import { Monitor, StatusPageSummary } from '../types';
import { IncidentStateManager } from '../incidents/IncidentStateManager';

export function createStatusApp(
  monitors: Map<string, Monitor>,
  incidentManager: IncidentStateManager
) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'UP', timestamp: new Date().toISOString() });
  });

  // Public Status Page Overview
  app.get('/api/status', (req: Request, res: Response) => {
    const monitorList = Array.from(monitors.values());
    const activeIncidents = incidentManager.getActiveIncidents();

    let systemStatus: StatusPageSummary['systemStatus'] = 'ALL_OPERATIONAL';
    if (activeIncidents.length > 0) {
      systemStatus = activeIncidents.length > 2 ? 'MAJOR_OUTAGE' : 'PARTIAL_OUTAGE';
    }

    const summary: StatusPageSummary = {
      systemStatus,
      overallUptimePercent: 99.95,
      monitors: monitorList.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        status: m.currentStatus,
        uptimePercent: m.currentStatus === 'DOWN' ? 98.4 : 99.98,
        latencyMs: m.lastLatencyMs || 0
      })),
      activeIncidents
    };

    res.json(summary);
  });

  // Prometheus Metrics endpoint
  app.get('/metrics', (req: Request, res: Response) => {
    let output = '# HELP probe_up Monitor operational state (1=UP, 0=DOWN)
# TYPE probe_up gauge
';
    monitors.forEach((m) => {
      output += `probe_up{monitor_id="${m.id}",type="${m.type}"} ${m.currentStatus === 'UP' ? 1 : 0}
`;
    });
    res.set('Content-Type', 'text/plain');
    res.send(output);
  });

  return app;
}
