import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface Heartbeat {
  ts: string;
  language: string;
  project: string;
  file: string;
  is_write?: boolean;
}

const FLUSH_INTERVAL_MS = 60 * 1000;
const MAX_QUEUE = 5000;

export class Sync {
  private queue: Heartbeat[] = [];
  private timer: NodeJS.Timeout | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.queue = context.globalState.get<Heartbeat[]>('codava.queue', []);
  }

  start(): vscode.Disposable {
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    return { dispose: () => this.timer && clearInterval(this.timer) };
  }

  enqueue(b: Heartbeat): void {
    this.queue.push(b);
    if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE);
  }

  private cfg(): { apiUrl: string; apiKey: string } {
    const c = vscode.workspace.getConfiguration('codava');
    return {
      apiUrl: c.get<string>('apiUrl', 'http://localhost:4000'),
      apiKey: c.get<string>('apiKey', ''),
    };
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const { apiUrl, apiKey } = this.cfg();
    if (!apiKey) return;

    const batch = this.queue.splice(0, 500);
    try {
      await this.post(`${apiUrl}/heartbeats`, apiKey, { heartbeats: batch });
      await this.context.globalState.update('codava.queue', this.queue);
    } catch {
      this.queue = batch.concat(this.queue);
      if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE);
      await this.context.globalState.update('codava.queue', this.queue);
    }
  }

  private post(url: string, apiKey: string, body: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? https : http;
      const data = Buffer.from(JSON.stringify(body));
      const req = lib.request(
        {
          method: 'POST',
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            Authorization: `Bearer ${apiKey}`,
          },
        },
        (res) => {
          res.resume();
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`status ${res.statusCode}`));
        },
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}
