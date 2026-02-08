import { FileText, Clock } from 'lucide-react';

export function StatusBar() {
  return (
    <footer className="h-8 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          <span>1.234 palavras</span>
        </div>
        <div className="h-3 w-px bg-zinc-700" />
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>~12 min de narração</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span>12 falas</span>
        <div className="h-3 w-px bg-zinc-700" />
        <span>4 personagens</span>
      </div>
    </footer>
  );
}
