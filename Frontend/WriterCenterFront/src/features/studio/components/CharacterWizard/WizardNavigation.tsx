/**
 * WizardNavigation Component
 * Navigation buttons: Back, Next, Confirm
 */

import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface WizardNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  isCurrentStepValid: boolean;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function WizardNavigation({
  isFirstStep,
  isLastStep,
  isLoading = false,
  isSaving = false,
  isCurrentStepValid,
  onBack,
  onNext,
  onConfirm,
  confirmLabel = 'Confirmar',
}: WizardNavigationProps) {
  const isDisabled = isLoading || isSaving;

  return (
    <div className="flex items-center justify-between gap-3 p-4 border-t border-zinc-800 bg-zinc-900">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={isFirstStep || isDisabled}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded transition-colors',
          'flex items-center gap-2',
          !isFirstStep && !isDisabled
            ? 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
            : 'text-zinc-600 cursor-not-allowed opacity-50'
        )}
        aria-label="Voltar"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Next or Confirm button */}
      <div className="flex gap-2 ml-auto">
        {!isLastStep ? (
          <button
            onClick={onNext}
            disabled={!isCurrentStepValid || isDisabled}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              'flex items-center gap-2',
              isCurrentStepValid && !isDisabled
                ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                : 'bg-amber-600 text-zinc-950 cursor-not-allowed opacity-50'
            )}
            aria-label="Próximo"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onConfirm}
            disabled={isDisabled}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded transition-colors',
              'flex items-center gap-2',
              !isDisabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-green-600 text-white cursor-not-allowed opacity-50'
            )}
            aria-label={confirmLabel}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {confirmLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
