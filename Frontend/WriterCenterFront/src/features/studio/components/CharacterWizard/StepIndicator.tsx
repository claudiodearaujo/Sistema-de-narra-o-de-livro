/**
 * StepIndicator Component
 * Shows current step, progress bar, and step navigation
 */

import { cn } from '../../../../shared/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
  isBasicStepValid?: boolean;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  completionPercentage,
  stepLabels,
  onStepClick,
  isBasicStepValid = false,
}: StepIndicatorProps) {
  const getProgressColor = () => {
    if (completionPercentage >= 70) return 'bg-green-500';
    if (completionPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Step indicator text and progress percentage */}
      <div className="flex items-center justify-between px-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-300">
            Etapa {currentStep} de {totalSteps}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {stepLabels[currentStep - 1] || 'Etapa'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-100">
            {completionPercentage}%
          </p>
          <p className="text-xs text-zinc-500">Preenchido</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              getProgressColor()
            )}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const isDisabled = stepNum > 1 && !isBasicStepValid && stepNum > currentStep;

          return (
            <button
              key={stepNum}
              onClick={() => !isDisabled && onStepClick?.(stepNum)}
              disabled={isDisabled}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full font-medium text-xs transition-all',
                'border border-zinc-700 flex items-center justify-center',
                isActive && 'bg-amber-500 text-zinc-950 border-amber-500 font-semibold',
                isCompleted && 'bg-green-500 text-white border-green-500',
                !isActive &&
                  !isCompleted &&
                  !isDisabled &&
                  'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                isDisabled && 'bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
              )}
              aria-label={`Etapa ${stepNum}`}
              title={isDisabled ? 'Complete as etapas anteriores primeiro' : `Etapa ${stepNum}`}
            >
              {isCompleted ? (
                <span className="text-lg">✓</span>
              ) : (
                <span>{stepNum}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
