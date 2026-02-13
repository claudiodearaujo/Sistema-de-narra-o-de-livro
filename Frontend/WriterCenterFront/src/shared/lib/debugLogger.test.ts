import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDebugLogs,
  clearDebugLogs,
  debugLog,
  subscribeDebugLogs,
} from './debugLogger';

describe('debugLogger', () => {
  beforeEach(() => {
    clearDebugLogs();
  });

  it('stores log entries via debugLog', () => {
    debugLog('info', 'hello', 'world');
    const logs = getDebugLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('hello world');
    expect(logs[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it('clears logs', () => {
    debugLog('log', 'test');
    expect(getDebugLogs()).toHaveLength(1);
    clearDebugLogs();
    expect(getDebugLogs()).toHaveLength(0);
  });

  it('notifies subscribers on new entry', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDebugLogs(listener);

    debugLog('error', 'boom');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    debugLog('warn', 'ignored');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference between mutations', () => {
    debugLog('log', 'a');
    const snap1 = getDebugLogs();
    const snap1again = getDebugLogs();
    expect(snap1).toBe(snap1again);

    debugLog('log', 'b');
    const snap2 = getDebugLogs();
    expect(snap2).not.toBe(snap1);
    expect(snap2).toHaveLength(2);
  });

  it('formats Error objects with stack', () => {
    const err = new Error('test error');
    debugLog('error', err);
    const logs = getDebugLogs();
    expect(logs[0].message).toContain('test error');
  });

  it('formats objects as JSON', () => {
    debugLog('log', { foo: 'bar' });
    const logs = getDebugLogs();
    expect(logs[0].message).toContain('"foo"');
    expect(logs[0].message).toContain('"bar"');
  });

  it('caps entries at MAX (200)', () => {
    for (let i = 0; i < 210; i++) {
      debugLog('log', `entry-${i}`);
    }
    expect(getDebugLogs()).toHaveLength(200);
    expect(getDebugLogs()[0].message).toBe('entry-10');
  });
});
