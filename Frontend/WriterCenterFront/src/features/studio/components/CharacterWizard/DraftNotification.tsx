/**
 * DraftNotification Component
 * Shows auto-save notification
 */

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface DraftNotificationProps {
  message?: string;
  lastSavedAt?: Date | null;
  error?: string | null;
  isSaving?: boolean;
  autoHideDuration?: number;
}

export function DraftNotification({
  message = 'Rascunho auto-salvo',
  lastSavedAt,
  error,
  isSaving = false,
  autoHideDuration = 5000,
}: DraftNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show notification when saved or error
  useEffect(() => {
    if (lastSavedAt || error) {
      setIsVisible(true);
      if (!error && autoHideDuration) {
        const timer = setTimeout(() => setIsVisible(false), autoHideDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [lastSavedAt, error, autoHideDuration]);

  if (!isVisible || (!lastSavedAt && !error)) {
    return null;
  }

  const isError = !!error;
  const displayMessage = error || message;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg border',
        'animate-in slide-in-from-bottom-4 duration-300',
        'flex items-start gap-3',
        isError
          ? 'bg-red-900/20 border-red-800 text-red-100'
          : 'bg-green-900/20 border-green-800 text-green-100'
      )}
    >
      {isSaving ? (
        <div className="mt-1 animate-spin">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : isError ? (
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{displayMessage}</p>
        {!isError && lastSavedAt && (
          <p className="text-xs opacity-75 mt-1">
            Última atualização: {formatTime(lastSavedAt)}
          </p>
        )}
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 ml-2 hover:opacity-75 transition-opacity"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
