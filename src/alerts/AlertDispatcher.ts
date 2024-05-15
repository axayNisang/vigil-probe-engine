import { Incident } from '../types';

export interface AlertChannel {
  name: string;
  webhookUrl: string;
}

export class AlertDispatcher {
  private channels: AlertChannel[] = [];

  public registerChannel(channel: AlertChannel): void {
    this.channels.push(channel);
  }

  public async dispatchIncident(incident: Incident, isResolution: boolean = false): Promise<void> {
    const payload = {
      event: isResolution ? 'INCIDENT_RESOLVED' : 'INCIDENT_TRIGGERED',
      monitorName: incident.monitorName,
      cause: incident.cause,
      timestamp: isResolution ? incident.resolvedAt : incident.startedAt,
      severity: isResolution ? 'INFO' : 'CRITICAL'
    };

    for (const channel of this.channels) {
      await this.sendWithRetry(channel.webhookUrl, payload, 3);
    }
  }

  private async sendWithRetry(url: string, payload: any, maxRetries: number): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Mock webhook dispatcher or fetch
        return true;
      } catch (err) {
        if (attempt === maxRetries) {
          console.error(`Failed to deliver webhook to ${url} after ${maxRetries} attempts`);
          return false;
        }
        await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 200));
      }
    }
    return false;
  }
}
