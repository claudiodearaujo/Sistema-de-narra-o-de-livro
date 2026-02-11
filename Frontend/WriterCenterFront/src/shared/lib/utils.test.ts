import { describe, expect, it, vi } from 'vitest';
import { cn, debounce, formatDuration, formatWordCount } from './utils';

describe('utils', () => {
  it('formatWordCount should format values below and above 1000', () => {
    expect(formatWordCount(999)).toBe('999');
    expect(formatWordCount(1200)).toBe('1.2k');
    expect(formatWordCount(1200000)).toBe('1.2M');
  });

  it('formatDuration should format mm:ss', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(8)).toBe('0:08');
  });

  it('cn should merge tailwind classes', () => {
    expect(cn('text-zinc-100', 'text-zinc-200')).toBe('text-zinc-200');
  });

  it('debounce should call function once with latest value', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('a');
    debounced('b');

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');

    vi.useRealTimers();
  });
});
