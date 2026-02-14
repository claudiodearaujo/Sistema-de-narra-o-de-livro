/**
 * WizardStep Component
 * Base component for wizard steps
 */

import { ReactNode } from 'react';
import { cn } from '../../../../shared/lib/utils';

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function WizardStep({
  title,
  description,
  children,
  className,
  isLoading = false,
}: WizardStepProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          {description && (
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>
    </div>
  );
}
