import { Monitor, ProbeResult } from '../types';
import { ProbeRunner } from '../probes/ProbeRunner';

export class WorkerPoolScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(
    private runner: ProbeRunner,
    private onResult: (monitor: Monitor, result: ProbeResult) => void
  ) {}

  public scheduleMonitor(monitor: Monitor): void {
    if (this.intervals.has(monitor.id)) {
      clearInterval(this.intervals.get(monitor.id)!);
    }

    const intervalTimer = setInterval(async () => {
      const result = await this.runner.executeProbe(monitor);
      this.onResult(monitor, result);
    }, monitor.intervalSeconds * 1000);

    this.intervals.set(monitor.id, intervalTimer);
  }

  public unschedule(monitorId: string): void {
    if (this.intervals.has(monitorId)) {
      clearInterval(this.intervals.get(monitorId)!);
      this.intervals.delete(monitorId);
    }
  }

  public stopAll(): void {
    this.intervals.forEach((timer) => clearInterval(timer));
    this.intervals.clear();
    this.isRunning = false;
  }
}
