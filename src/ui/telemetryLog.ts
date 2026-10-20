import { LogEntry, LogLevel } from '../types.ts';

export class TelemetryLog {
  private container: HTMLElement;
  private entries: LogEntry[] = [];

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`TelemetryLog container #${containerId} not found`);
    }
    this.container = el;
  }

  public log(type: LogLevel, message: string): void {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
    
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      type,
      message
    };

    this.entries.push(entry);
    this.renderEntry(entry);
    this.scrollToBottom();
  }

  public clear(): void {
    this.entries = [];
    this.container.innerHTML = '';
  }

  private renderEntry(entry: LogEntry): void {
    const row = document.createElement('div');
    row.className = `log-entry log-${entry.type.toLowerCase()}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${entry.timestamp}]`;

    const badge = document.createElement('span');
    badge.className = `log-badge badge-${entry.type.toLowerCase()}`;
    badge.textContent = entry.type;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = entry.message;

    row.appendChild(timeSpan);
    row.appendChild(badge);
    row.appendChild(msgSpan);

    this.container.appendChild(row);
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
