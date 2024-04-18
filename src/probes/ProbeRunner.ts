import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
import { Monitor, ProbeResult } from '../types';

export class ProbeRunner {
  public async executeProbe(monitor: Monitor): Promise<ProbeResult> {
    const start = Date.now();
    try {
      switch (monitor.type) {
        case 'HTTP':
          return await this.probeHttp(monitor, start);
        case 'TCP':
          return await this.probeTcp(monitor, start);
        case 'TLS_CERT':
          return await this.probeTlsCert(monitor, start);
        default:
          throw new Error(`Unsupported probe type: ${monitor.type}`);
      }
    } catch (err: any) {
      return {
        monitorId: monitor.id,
        isUp: false,
        latencyMs: Date.now() - start,
        errorMessage: err.message || 'Probe execution failed',
        checkedAt: new Date().toISOString()
      };
    }
  }

  private probeHttp(monitor: Monitor, start: number): Promise<ProbeResult> {
    return new Promise((resolve) => {
      const url = new URL(monitor.target);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.get(url, { timeout: monitor.timeoutMs }, (res) => {
        const latencyMs = Date.now() - start;
        const isUp = (res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 400;
        resolve({
          monitorId: monitor.id,
          isUp,
          statusCode: res.statusCode,
          latencyMs,
          checkedAt: new Date().toISOString(),
          errorMessage: isUp ? undefined : `HTTP Status ${res.statusCode}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: monitor.timeoutMs,
          errorMessage: 'Connection timed out',
          checkedAt: new Date().toISOString()
        });
      });

      req.on('error', (err) => {
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: Date.now() - start,
          errorMessage: err.message,
          checkedAt: new Date().toISOString()
        });
      });
    });
  }

  private probeTcp(monitor: Monitor, start: number): Promise<ProbeResult> {
    return new Promise((resolve) => {
      const [host, portStr] = monitor.target.split(':');
      const port = parseInt(portStr, 10);

      const socket = new net.Socket();
      socket.setTimeout(monitor.timeoutMs);

      socket.connect(port, host, () => {
        const latencyMs = Date.now() - start;
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: true,
          latencyMs,
          checkedAt: new Date().toISOString()
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: monitor.timeoutMs,
          errorMessage: 'TCP connect timeout',
          checkedAt: new Date().toISOString()
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: Date.now() - start,
          errorMessage: err.message,
          checkedAt: new Date().toISOString()
        });
      });
    });
  }

  private probeTlsCert(monitor: Monitor, start: number): Promise<ProbeResult> {
    return new Promise((resolve) => {
      const [host, portStr] = monitor.target.split(':');
      const port = portStr ? parseInt(portStr, 10) : 443;

      const socket = tls.connect(port, host, { servername: host, timeout: monitor.timeoutMs }, () => {
        const latencyMs = Date.now() - start;
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || !cert.valid_to) {
          resolve({
            monitorId: monitor.id,
            isUp: false,
            latencyMs,
            errorMessage: 'Unable to retrieve peer TLS certificate',
            checkedAt: new Date().toISOString()
          });
          return;
        }

        const validTo = new Date(cert.valid_to).getTime();
        const daysRemaining = (validTo - Date.now()) / (1000 * 60 * 60 * 24);

        if (daysRemaining < 14) {
          resolve({
            monitorId: monitor.id,
            isUp: false,
            latencyMs,
            errorMessage: `TLS Certificate expires in ${Math.round(daysRemaining)} days`,
            checkedAt: new Date().toISOString()
          });
        } else {
          resolve({
            monitorId: monitor.id,
            isUp: true,
            latencyMs,
            checkedAt: new Date().toISOString()
          });
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: monitor.timeoutMs,
          errorMessage: 'TLS Handshake timeout',
          checkedAt: new Date().toISOString()
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          isUp: false,
          latencyMs: Date.now() - start,
          errorMessage: err.message,
          checkedAt: new Date().toISOString()
        });
      });
    });
  }
}
