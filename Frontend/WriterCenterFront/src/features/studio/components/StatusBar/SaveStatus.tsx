import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface SaveStatusProps {
  isDirty: boolean;
  lastSavedAt: Date | null;
  isSaving?: boolean;
  hasError?: boolean;
}

export function SaveStatus({ isDirty, lastSavedAt, isSaving = false, hasError = false }: SaveStatusProps) {
  const getTimeAgo = (date: Date | null): string => {
    if (!date) return 'Nunca';
    
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 5) return 'Agora mesmo';
    if (seconds < 60) return `${seconds}s atrás`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-1.5 text-red-400">
        <CloudOff className="w-3.5 h-3.5" />
        <span className="text-xs">Erro ao salvar</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-blue-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs">Salvando...</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-amber-400">
        <Cloud className="w-3.5 h-3.5" />
        <span className="text-xs">Alterações não salvas</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-1.5 transition-colors',
      lastSavedAt ? 'text-emerald-400' : 'text-zinc-600'
    )}>
      <Check className="w-3.5 h-3.5" />
      <span className="text-xs">
        {lastSavedAt ? `Salvo ${getTimeAgo(lastSavedAt)}` : 'Não salvo'}
      </span>
    </div>
  );
}
