import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Loader2, Bot, User, Zap } from 'lucide-react';
import { http } from '../../../../shared/api/http';
import { endpoints } from '../../../../shared/api/endpoints';
import { cn } from '../../../../shared/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { label: 'Revisar ortografia', prompt: 'Revise a ortografia e gramática das falas selecionadas.' },
  { label: 'Sugerir melhorias', prompt: 'Sugira melhorias para tornar as falas mais expressivas.' },
  { label: 'Enriquecer contexto', prompt: 'Enriqueça o contexto emocional das falas selecionadas.' },
  { label: 'Reescrever', prompt: 'Reescreva as falas mantendo o significado mas com estilo diferente.' },
];

let msgCounter = 0;
const nextId = () => String(++msgCounter);

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { id: nextId(), role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const { data } = await http.post(endpoints.ai.chat, {
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const assistantMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: data.message ?? data.content ?? 'Sem resposta.',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', content: 'Erro ao conectar com a IA. Tente novamente.' },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick actions */}
      <div className="p-3 border-b border-zinc-800">
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
            >
              <Zap className="w-3 h-3 shrink-0 text-amber-500" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">Pergunte qualquer coisa sobre seu livro ou falas.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-amber-500/15 text-zinc-200'
                  : 'bg-zinc-800 text-zinc-300'
              )}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="bg-zinc-800 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem... (Enter para enviar)"
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 transition-colors self-end"
            title="Enviar"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
