/**
 * Performance Utilities for Character Wizard
 * Metrics, profiling, and optimization helpers
 */

/**
 * Performance metric tracker
 */
export class PerformanceMetrics {
  private static marks = new Map<string, number>();
  private static metrics = new Map<string, number[]>();

  /**
   * Start measuring a metric
   */
  static startMeasure(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End measuring and store the duration
   */
  static endMeasure(label: string): number {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    const metrics = this.metrics.get(label) || [];
    metrics.push(duration);
    this.metrics.set(label, metrics);

    this.marks.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get average duration for a metric
   */
  static getAverageDuration(label: string): number {
    const metrics = this.metrics.get(label) || [];
    if (metrics.length === 0) return 0;
    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
  }

  /**
   * Get all metrics
   */
  static getAllMetrics() {
    const result: Record<string, any> = {};
    this.metrics.forEach((durations, label) => {
      result[label] = {
        count: durations.length,
        avg: this.getAverageDuration(label),
        min: Math.min(...durations),
        max: Math.max(...durations),
      };
    });
    return result;
  }

  /**
   * Reset all metrics
   */
  static reset(): void {
    this.marks.clear();
    this.metrics.clear();
  }
}

/**
 * Debounce function with leading option
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (options?.leading && timeSinceLastCall >= wait) {
      func(...args);
      lastCallTime = now;
    }

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      if (options?.trailing !== false) {
        func(...args);
      }
      timeout = null;
      lastCallTime = Date.now();
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      func(...args);
      lastCall = now;
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
        lastCall = Date.now();
      }, limit - (now - lastCall));
    }
  };
}

/**
 * Measure render time of a component
 */
export function measureRenderTime(componentName: string): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes(componentName)) {
          console.debug(`[Render] ${componentName}: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['measure', 'longtask'] });
    } catch (e) {
      // Some browsers don't support longtask
      observer.observe({ entryTypes: ['measure'] });
    }
  }
}

/**
 * Track component mount/unmount
 */
export function trackComponentLifecycle(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Mount] ${componentName}`);

    return () => {
      console.debug(`[Unmount] ${componentName}`);
    };
  }
}

/**
 * Monitor memory usage (development only)
 */
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }
  return null;
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  return setTimeout(callback, 0) as unknown as number;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Memoization helper for expensive computations
 */
export class Memoizer<T> {
  private cache: Map<string, T> = new Map();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  memoize(key: string, compute: () => T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const result = compute();

    // Simple LRU cache eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
    return result;
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

/**
 * Virtual scrolling helper (for large lists)
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  bufferSize?: number;
}

export function getVisibleRange(
  scrollTop: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, items, bufferSize = 5 } = options;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - bufferSize
  );
  const endIndex = Math.min(
    items.length,
    startIndex + visibleCount + bufferSize * 2
  );

  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex),
    offsetY: startIndex * itemHeight,
  };
}
