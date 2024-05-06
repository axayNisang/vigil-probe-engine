import { Incident, Monitor, ProbeResult } from '../types';

export class IncidentStateManager {
  private activeIncidents: Map<string, Incident> = new Map();
  private incidentHistory: Incident[] = [];

  constructor(
    private onIncidentOpened?: (incident: Incident) => void,
    private onIncidentResolved?: (incident: Incident) => void
  ) {}

  public processProbeResult(monitor: Monitor, result: ProbeResult): void {
    monitor.lastCheckedAt = result.checkedAt;
    monitor.lastLatencyMs = result.latencyMs;

    if (result.isUp) {
      if (monitor.currentStatus === 'DOWN') {
        // Resolve active incident
        const active = this.activeIncidents.get(monitor.id);
        if (active) {
          active.resolvedAt = new Date().toISOString();
          this.incidentHistory.push(active);
          this.activeIncidents.delete(monitor.id);
          this.onIncidentResolved?.(active);
        }
      }
      monitor.currentStatus = 'UP';
      monitor.consecutiveFailures = 0;
    } else {
      monitor.consecutiveFailures += 1;

      if (monitor.consecutiveFailures >= monitor.consecutiveFailuresThreshold && monitor.currentStatus !== 'DOWN') {
        monitor.currentStatus = 'DOWN';
        const incident: Incident = {
          id: `inc_${Date.now()}_${monitor.id}`,
          monitorId: monitor.id,
          monitorName: monitor.name,
          startedAt: new Date().toISOString(),
          cause: result.errorMessage || 'Threshold exceeded'
        };
        this.activeIncidents.set(monitor.id, incident);
        this.onIncidentOpened?.(incident);
      } else if (monitor.consecutiveFailures > 0 && monitor.currentStatus !== 'DOWN') {
        monitor.currentStatus = 'DEGRADED';
      }
    }
  }

  public getActiveIncidents(): Incident[] {
    return Array.from(this.activeIncidents.values());
  }

  public getHistory(): Incident[] {
    return this.incidentHistory;
  }
}
