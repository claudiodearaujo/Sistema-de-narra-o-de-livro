import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Bug, Trash2, X } from 'lucide-react';
import {
  getDebugLogs,
  subscribeDebugLogs,
  clearDebugLogs,
  type LogEntry,
} from '../../../shared/lib/debugLogger';
import { useState } from 'react';

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  log: 'text-zinc-400',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

/**
 * Floating debug log panel — shows captured console output on screen.
 * Designed to be readable on mobile devices.
 */
export function DebugLogPanel() {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const logs: LogEntry[] = useSyncExternalStore(subscribeDebugLogs, getDebugLogs, getDebugLogs);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4 z-[9999] flex items-center gap-1 px-2 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-full text-zinc-400 hover:text-zinc-200 text-[10px] backdrop-blur-sm transition-all shadow-lg"
        title="Abrir painel de debug"
      >
        <Bug className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Debug</span>
        {logs.length > 0 && (
          <span className="ml-1 bg-amber-600 text-white rounded-full px-1.5 text-[9px] leading-tight">
            {logs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col max-h-[60vh] bg-zinc-900/95 border-t border-zinc-700 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 shrink-0">
        <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-amber-500" />
          Debug Logs ({logs.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => clearDebugLogs()}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Limpar logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-0.5 font-mono text-[10px] leading-snug">
        {logs.length === 0 && (
          <p className="text-zinc-600 text-center py-4">Nenhum log registrado</p>
        )}
        {logs.map((entry, i) => (
          <div key={i} className={`flex gap-2 ${LEVEL_COLORS[entry.level]}`}>
            <span className="text-zinc-600 shrink-0 select-none">{entry.timestamp}</span>
            <span className="shrink-0 uppercase w-10 select-none">[{entry.level}]</span>
            <span className="break-all whitespace-pre-wrap">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
