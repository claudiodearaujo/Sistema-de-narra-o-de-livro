/**
 * Optimized Component Wrappers
 * High-performance memoized components for the wizard
 */

import React, { useMemo, useCallback, memo } from 'react';

/**
 * Memoized Form Field Component
 * Prevents re-renders when props don't change
 */
export const OptimizedFormField = memo(
  ({ label, value, onChange, ...props }: any) => {
    // Memoize the onChange callback to prevent unnecessary updates
    const memoizedOnChange = useCallback(
      (newValue: any) => {
        onChange(newValue);
      },
      [onChange]
    );

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {props.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => memoizedOnChange(e.target.value)}
            {...props}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-amber-500/50"
          />
        ) : props.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => memoizedOnChange(e.target.value)}
            {...props}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-amber-500/50"
          >
            {props.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={props.type || 'text'}
            value={value}
            onChange={(e) => memoizedOnChange(e.target.value)}
            {...props}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        )}

        {props.error && (
          <p className="text-red-400 text-xs">{props.error}</p>
        )}
      </div>
    );
  }
);

OptimizedFormField.displayName = 'OptimizedFormField';

/**
 * Lazy load step components to reduce initial bundle size
 * This improves initial page load time
 */
export const LazyStepLoader = {
  /**
   * Dynamically import step components
   */
  importStep: async (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return import('../steps/BasicStep').then((m) => m.BasicStep);
      case 2:
        return import('../steps/IdentityStep').then((m) => m.IdentityStep);
      case 3:
        return import('../steps/PhysiqueStep').then((m) => m.PhysiqueStep);
      case 4:
        return import('../steps/FaceStep').then((m) => m.FaceStep);
      case 5:
        return import('../steps/EyesStep').then((m) => m.EyesStep);
      case 6:
        return import('../steps/HairStep').then((m) => m.HairStep);
      case 7:
        return import('../steps/WardrobeStep').then((m) => m.WardrobeStep);
      default:
        throw new Error(`Unknown step: ${stepNumber}`);
    }
  },
};

/**
 * Memoized Step Container
 * Wraps step components with performance optimizations
 */
export const OptimizedStepContainer = memo(
  ({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
  }) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          {description && (
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">{children}</div>
      </div>
    );
  }
);

OptimizedStepContainer.displayName = 'OptimizedStepContainer';

/**
 * Memoized Button Component with callback optimization
 */
export const OptimizedButton = memo(
  ({
    onClick,
    disabled = false,
    loading = false,
    children,
    variant = 'primary',
    ...props
  }: {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    // Memoize callback
    const memoizedOnClick = useCallback(() => {
      if (!disabled && !loading) {
        onClick();
      }
    }, [onClick, disabled, loading]);

    const variantStyles = {
      primary: 'bg-amber-500 text-zinc-950 hover:bg-amber-400',
      secondary: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    return (
      <button
        onClick={memoizedOnClick}
        disabled={disabled || loading}
        className={`px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2 ${variantStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      >
        {loading && <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />}
        {children}
      </button>
    );
  }
);

OptimizedButton.displayName = 'OptimizedButton';

/**
 * Compute expensive calculations only when dependencies change
 * Prevents recalculation on every render
 */
export function useComputedValue<T>(
  computeFn: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(() => computeFn(), dependencies);
}

/**
 * Debounced value that updates after a delay
 * Useful for expensive operations like API calls
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number
): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback that limits execution frequency
 * Prevents excessive updates
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastRun, setLastRun] = React.useState(Date.now());

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastRun >= delay) {
        setLastRun(now);
        callback(...args);
      }
    },
    [callback, delay, lastRun]
  ) as T;
}

/**
 * Memoized list component with virtualization support
 * Renders only visible items for large lists
 */
export const OptimizedList = memo(
  ({
    items,
    renderItem,
    keyExtractor,
    containerHeight = 400,
    itemHeight = 50,
  }: {
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    keyExtractor: (item: any, index: number) => string | number;
    containerHeight?: number;
    itemHeight?: number;
  }) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const visibleItems = useMemo(() => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
      return items.slice(startIndex, Math.min(endIndex, items.length)).map((item, idx) => ({
        item,
        index: startIndex + idx,
      }));
    }, [scrollTop, items, itemHeight, containerHeight]);

    return (
      <div
        className="overflow-y-auto"
        style={{ height: containerHeight }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: items.length * itemHeight }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={keyExtractor(item, index)}
              style={{
                transform: `translateY(${index * itemHeight}px)`,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

OptimizedList.displayName = 'OptimizedList';
