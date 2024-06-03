import { IncidentStateManager } from '../src/incidents/IncidentStateManager';
import { Monitor, ProbeResult } from '../src/types';

describe('IncidentStateManager', () => {
  let manager: IncidentStateManager;
  let monitor: Monitor;

  beforeEach(() => {
    manager = new IncidentStateManager();
    monitor = {
      id: 'test_mon_1',
      name: 'Auth Gateway',
      type: 'HTTP',
      target: 'http://localhost:8080',
      intervalSeconds: 10,
      timeoutMs: 2000,
      consecutiveFailuresThreshold: 3,
      currentStatus: 'UP',
      consecutiveFailures: 0
    };
  });

  test('does not trip incident until threshold is satisfied', () => {
    const failureResult: ProbeResult = {
      monitorId: monitor.id,
      isUp: false,
      latencyMs: 2000,
      errorMessage: 'Gateway Timeout 504',
      checkedAt: new Date().toISOString()
    };

    // First failure: status DEGRADED
    manager.processProbeResult(monitor, failureResult);
    expect(monitor.consecutiveFailures).toBe(1);
    expect(monitor.currentStatus).toBe('DEGRADED');
    expect(manager.getActiveIncidents().length).toBe(0);

    // Second failure: still DEGRADED
    manager.processProbeResult(monitor, failureResult);
    expect(monitor.consecutiveFailures).toBe(2);
    expect(monitor.currentStatus).toBe('DEGRADED');
    expect(manager.getActiveIncidents().length).toBe(0);

    // Third failure: crosses threshold -> DOWN and creates active incident
    manager.processProbeResult(monitor, failureResult);
    expect(monitor.consecutiveFailures).toBe(3);
    expect(monitor.currentStatus).toBe('DOWN');
    expect(manager.getActiveIncidents().length).toBe(1);
    expect(manager.getActiveIncidents()[0].cause).toBe('Gateway Timeout 504');
  });

  test('resolves active incident when probe succeeds', () => {
    const failureResult: ProbeResult = {
      monitorId: monitor.id,
      isUp: false,
      latencyMs: 1000,
      errorMessage: 'Conn refused',
      checkedAt: new Date().toISOString()
    };

    // Trip the incident by 3 failures
    manager.processProbeResult(monitor, failureResult);
    manager.processProbeResult(monitor, failureResult);
    manager.processProbeResult(monitor, failureResult);

    expect(monitor.currentStatus).toBe('DOWN');
    expect(manager.getActiveIncidents().length).toBe(1);

    // Now success arrives
    const successResult: ProbeResult = {
      monitorId: monitor.id,
      isUp: true,
      latencyMs: 42,
      checkedAt: new Date().toISOString()
    };
    manager.processProbeResult(monitor, successResult);

    expect(monitor.currentStatus).toBe('UP');
    expect(monitor.consecutiveFailures).toBe(0);
    expect(manager.getActiveIncidents().length).toBe(0);
    expect(manager.getHistory().length).toBe(1);
  });
});
