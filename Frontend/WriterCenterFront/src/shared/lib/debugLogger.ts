type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];
const listeners: Set<() => void> = new Set();
let snapshot: LogEntry[] = [];

function notifyListeners() {
  snapshot = [...entries];
  listeners.forEach((fn) => fn());
}

function formatArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`;
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      }
      return String(a);
    })
    .join(' ');
}

function push(level: LogLevel, args: unknown[]) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString().slice(11, 23),
    level,
    message: formatArgs(args),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  notifyListeners();
}

/** Subscribe to new log entries; returns unsubscribe fn */
export function subscribeDebugLogs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Get a snapshot of current log entries (stable reference between mutations) */
export function getDebugLogs(): LogEntry[] {
  return snapshot;
}

/** Clear all log entries */
export function clearDebugLogs(): void {
  entries.length = 0;
  notifyListeners();
}

/** Manually add a log entry */
export function debugLog(level: LogLevel, ...args: unknown[]): void {
  push(level, args);
}

/**
 * Patch global console so every log/warn/error/info is also captured.
 * Call once at app startup.
 */
export function installDebugLogCapture(): void {
  const levels: LogLevel[] = ['log', 'warn', 'error', 'info'];
  let capturing = false;

  for (const level of levels) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      if (!capturing) {
        capturing = true;
        push(level, args);
        capturing = false;
      }
    };
  }
}
