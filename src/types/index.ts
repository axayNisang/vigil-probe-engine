export type MonitorType = 'HTTP' | 'TCP' | 'TLS_CERT';
export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED';

export interface Monitor {
  id: string;
  name: string;
  type: MonitorType;
  target: string; // URL or host:port
  intervalSeconds: number;
  timeoutMs: number;
  consecutiveFailuresThreshold: number;
  currentStatus: MonitorStatus;
  consecutiveFailures: number;
  lastCheckedAt?: string;
  lastLatencyMs?: number;
}

export interface ProbeResult {
  monitorId: string;
  isUp: boolean;
  latencyMs: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  startedAt: string;
  resolvedAt?: string;
  cause: string;
}

export interface StatusPageSummary {
  systemStatus: 'ALL_OPERATIONAL' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE';
  overallUptimePercent: number;
  monitors: Array<{
    id: string;
    name: string;
    type: MonitorType;
    status: MonitorStatus;
    uptimePercent: number;
    latencyMs: number;
  }>;
  activeIncidents: Incident[];
}
