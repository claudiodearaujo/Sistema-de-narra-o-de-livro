import { useState, useRef, useEffect, useCallback } from "react";
import { 
  BookOpen, ChevronRight, ChevronDown, Plus, Sparkles, Mic, Image, Music, 
  Volume2, Pause, Play, MoreHorizontal, GripVertical, User, Settings,
  Wand2, Check, X, Type, Clock, Megaphone, ArrowUp, ArrowDown,
  FileText, Users, BarChart3, Eye, Trash2, Copy, Scissors, PenTool,
  Palette, Layers, Search, MessageSquare, Lightbulb, Zap, RefreshCw,
  ChevronLeft, Maximize2, Minimize2, Send, Bot, Hash, AlignLeft,
  Bold, Italic, Underline, List, Quote, Heading1, Code, Link,
  Camera, Film, Headphones, CloudRain, Sun, Moon, Star, Heart,
  AlertCircle, CheckCircle, Info, HelpCircle, Menu, PanelLeftClose,
  PanelRightClose, Keyboard, Save, Download, Share2, Undo, Redo
} from "lucide-react";

// ─── DATA MODELS ───
const mockCharacters = [
  { id: "c1", name: "Narrador", role: "narrator", color: "#8B95A5", voice: "Schedar", avatar: "N" },
  { id: "c2", name: "Helena", role: "protagonist", color: "#E8845C", voice: "Kore", avatar: "H" },
  { id: "c3", name: "Rafael", role: "protagonist", color: "#5B8DEF", voice: "Charon", avatar: "R" },
  { id: "c4", name: "Dr. Menezes", role: "supporting", color: "#7C6BC4", voice: "Orus", avatar: "D" },
];

const mockChapters = [
  { id: "ch1", title: "A Partida", order: 1, status: "completed", wordCount: 2840 },
  { id: "ch2", title: "Caminhos Cruzados", order: 2, status: "in_progress", wordCount: 1560 },
  { id: "ch3", title: "O Segredo", order: 3, status: "draft", wordCount: 0 },
  { id: "ch4", title: "Revelações", order: 4, status: "draft", wordCount: 0 },
];

const mockSpeeches = [
  {
    id: "s1", characterId: "c1", order: 1,
    text: "O sol se punha lentamente sobre a cidade de São Paulo, tingindo os arranha-céus de tons alaranjados. Helena observava tudo da janela do seu apartamento no vigésimo andar, com uma xícara de café já fria entre as mãos. Fazia três meses desde a última vez que falara com Rafael.",
    hasAudio: true, hasImage: true, emotion: "melancolia",
    tags: [{ type: "pause", position: 89, duration: "500ms" }]
  },
  {
    id: "s2", characterId: "c2", order: 2,
    text: "Eu preciso sair daqui. Preciso encontrar respostas antes que seja tarde demais.",
    hasAudio: true, hasImage: false, emotion: "determinação",
    tags: [{ type: "emphasis", start: 0, end: 26, level: "strong" }]
  },
  {
    id: "s3", characterId: "c1", order: 3,
    text: "Ela pegou o casaco e as chaves, sem olhar para trás. A porta se fechou com um clique suave — o som de uma decisão irrevogável.",
    hasAudio: false, hasImage: false, emotion: "tensão",
    tags: [{ type: "pause", position: 60, duration: "800ms" }]
  },
  {
    id: "s4", characterId: "c3", order: 4,
    text: "Helena? É você? Eu não acredito... depois de tanto tempo.",
    hasAudio: false, hasImage: false, emotion: "surpresa",
    tags: [{ type: "emphasis", start: 0, end: 7, level: "moderate" }]
  },
  {
    id: "s5", characterId: "c2", order: 5,
    text: "Rafael. Precisamos conversar. Sobre tudo. Sobre o que aconteceu naquela noite.",
    hasAudio: false, hasImage: false, emotion: "séria",
    tags: []
  },
  {
    id: "s6", characterId: "c1", order: 6,
    text: "O silêncio entre eles era denso como neblina. Anos de palavras não ditas pairavam no ar, esperando o momento certo para serem libertadas.",
    hasAudio: false, hasImage: false, emotion: "tensão",
    tags: [{ type: "pause", position: 44, duration: "1s" }]
  },
];

// ─── TAG TOOLBAR ───
const TagButton = ({ icon: Icon, label, tooltip, active, onClick }) => (
  <button 
    onClick={onClick}
    title={tooltip}
    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
      active 
        ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30" 
        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
    }`}
  >
    <Icon size={13} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// ─── SPEECH BLOCK ───
const SpeechBlock = ({ speech, character, isSelected, isEditing, onSelect, onEdit, onStartEdit, onCancelEdit, onSaveEdit, editText, setEditText, selectedSpeeches, onToggleSelect }) => {
  const isNarrator = character?.role === "narrator";
  const textRef = useRef(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.setSelectionRange(textRef.current.value.length, textRef.current.value.length);
    }
  }, [isEditing]);

  return (
    <div 
      className={`group relative transition-all duration-200 ${
        isSelected ? "ring-1 ring-amber-500/40 bg-amber-500/5" : ""
      }`}
      style={{ 
        borderLeft: isNarrator ? "none" : `3px solid ${character?.color}22`,
      }}
    >
      {/* Selection checkbox - appears on hover */}
      <div className="absolute -left-8 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onToggleSelect(speech.id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
            selectedSpeeches.includes(speech.id)
              ? "bg-amber-500 border-amber-500 text-black"
              : "border-zinc-600 hover:border-zinc-400"
          }`}
        >
          {selectedSpeeches.includes(speech.id) && <Check size={12} />}
        </button>
      </div>

      <div className={`px-4 py-3 ${isNarrator ? "" : "pl-5"}`}>
        {/* Character indicator */}
        {!isNarrator && (
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ backgroundColor: character?.color }}
            >
              {character?.avatar}
            </div>
            <span className="text-sm font-medium" style={{ color: character?.color }}>
              {character?.name}
            </span>
            {speech.emotion && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 italic">
                {speech.emotion}
              </span>
            )}
          </div>
        )}

        {/* Text content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                isNarrator ? "text-zinc-300 leading-relaxed text-[15px]" : "text-zinc-200 text-[15px]"
              }`}
              rows={Math.max(3, editText.split("\n").length + 1)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onCancelEdit();
                if (e.key === "Enter" && e.ctrlKey) onSaveEdit();
              }}
            />
            {/* Inline tag tools */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-zinc-600 mr-1">Inserir:</span>
              <TagButton icon={Clock} label="Pausa" tooltip="Inserir pausa na narração (⌘P)" />
              <TagButton icon={Megaphone} label="Ênfase" tooltip="Dar ênfase ao trecho selecionado (⌘E)" />
              <TagButton icon={ArrowUp} label="Tom ↑" tooltip="Aumentar tom de voz" />
              <TagButton icon={ArrowDown} label="Tom ↓" tooltip="Diminuir tom de voz" />
              <TagButton icon={Zap} label="Sussurro" tooltip="Falar em sussurro" />
              <div className="h-4 w-px bg-zinc-700 mx-1" />
              <TagButton icon={Bold} label="Negrito" tooltip="Negrito (⌘B)" />
              <TagButton icon={Italic} label="Itálico" tooltip="Itálico (⌘I)" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">Ctrl+Enter para salvar · Esc para cancelar</span>
              <div className="flex gap-2">
                <button onClick={onCancelEdit} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">Cancelar</button>
                <button onClick={onSaveEdit} className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-500">Salvar</button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`cursor-text select-text ${
              isNarrator 
                ? "text-zinc-400 leading-[1.85] text-[15px] italic" 
                : "text-zinc-200 leading-[1.8] text-[15px]"
            }`}
            onClick={() => onStartEdit(speech)}
          >
            {speech.text}
            {/* Visual tag indicators */}
            {speech.tags?.map((tag, i) => {
              if (tag.type === "pause") return (
                <span key={i} className="inline-flex items-center mx-1 text-[10px] text-amber-500/60 bg-amber-500/10 px-1 rounded" title={`Pausa: ${tag.duration}`}>
                  ⏸ {tag.duration}
                </span>
              );
              return null;
            })}
          </div>
        )}

        {/* Media indicators + hover actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {speech.hasAudio && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500/70">
                <Volume2 size={10} /> áudio
              </span>
            )}
            {speech.hasImage && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400/70">
                <Image size={10} /> cena
              </span>
            )}
          </div>
          
          {/* Quick actions on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 text-zinc-600 hover:text-amber-400 transition-colors" title="Gerar áudio TTS">
              <Mic size={13} />
            </button>
            <button className="p-1 text-zinc-600 hover:text-blue-400 transition-colors" title="Gerar imagem da cena">
              <Camera size={13} />
            </button>
            <button className="p-1 text-zinc-600 hover:text-purple-400 transition-colors" title="Gerar áudio ambiente">
              <CloudRain size={13} />
            </button>
            <button className="p-1 text-zinc-600 hover:text-yellow-400 transition-colors" title="Assistente IA">
              <Sparkles size={13} />
            </button>
            <button className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors" title="Mais opções">
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AI CHAT PANEL ───
const AiChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Olá! Sou o assistente da Livrya. Posso ajudar com correção ortográfica, sugestões de estilo, enriquecimento de contexto, ou qualquer dúvida sobre sua história. Como posso ajudar?" }
  ]);
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  const quickActions = [
    { icon: Check, label: "Revisar ortografia", color: "text-emerald-400" },
    { icon: Lightbulb, label: "Sugerir melhorias", color: "text-amber-400" },
    { icon: Users, label: "Enriquecer com personagem", color: "text-blue-400" },
    { icon: RefreshCw, label: "Reescrever trecho", color: "text-purple-400" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-zinc-200">Assistente IA</span>
            <span className="block text-[10px] text-emerald-500">Online</span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X size={16} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 border-b border-zinc-800/50">
        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((action, i) => (
            <button key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-all text-left">
              <action.icon size={12} className={action.color} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user" 
                ? "bg-amber-600/20 text-amber-100 rounded-br-sm" 
                : "bg-zinc-800 text-zinc-300 rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Peça ajuda com sua escrita..."
            className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                setMessages([...messages, { role: "user", text: input }, { role: "assistant", text: "Analisando o trecho selecionado... Encontrei algumas sugestões de melhoria para enriquecer a narrativa. Posso aplicar as correções diretamente?" }]);
                setInput("");
              }
            }}
          />
          <button className="px-3 py-2 bg-amber-600 rounded-lg text-white hover:bg-amber-500 transition-colors">
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── MAIN COMPONENT ───
export default function LivryaWriterStudio() {
  // State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("ai");
  const [selectedChapter, setSelectedChapter] = useState("ch2");
  const [expandedChapters, setExpandedChapters] = useState(["ch2"]);
  const [speeches, setSpeeches] = useState(mockSpeeches);
  const [selectedSpeeches, setSelectedSpeeches] = useState([]);
  const [editingSpeech, setEditingSpeech] = useState(null);
  const [editText, setEditText] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [showNewSpeech, setShowNewSpeech] = useState(false);
  const [newSpeechChar, setNewSpeechChar] = useState("");
  const [newSpeechText, setNewSpeechText] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [showCharDropdown, setShowCharDropdown] = useState(false);
  const canvasRef = useRef(null);
  const newSpeechRef = useRef(null);

  const currentChapter = mockChapters.find(c => c.id === selectedChapter);

  const toggleSpeechSelect = (id) => {
    setSelectedSpeeches(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const startEdit = (speech) => {
    setEditingSpeech(speech.id);
    setEditText(speech.text);
  };

  const cancelEdit = () => {
    setEditingSpeech(null);
    setEditText("");
  };

  const saveEdit = () => {
    setSpeeches(prev => prev.map(s => s.id === editingSpeech ? { ...s, text: editText } : s));
    setEditingSpeech(null);
    setEditText("");
  };

  const addNewSpeech = () => {
    if (!newSpeechText.trim() || !newSpeechChar) return;
    const newSpeech = {
      id: `s${Date.now()}`,
      characterId: newSpeechChar,
      order: speeches.length + 1,
      text: newSpeechText,
      hasAudio: false,
      hasImage: false,
      emotion: "",
      tags: []
    };
    setSpeeches([...speeches, newSpeech]);
    setNewSpeechText("");
    setShowNewSpeech(false);
    setTimeout(() => {
      canvasRef.current?.scrollTo({ top: canvasRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // Total word count
  const totalWords = speeches.reduce((acc, s) => acc + s.text.split(/\s+/).length, 0);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden" style={{ fontFamily: "'Source Serif 4', 'Lora', Georgia, serif" }}>
      
      {/* ─── TOP BAR ─── */}
      <header className="h-12 bg-zinc-900/80 backdrop-blur border-b border-zinc-800/50 flex items-center justify-between px-3 shrink-0 z-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all"
          >
            {leftSidebarOpen ? <PanelLeftClose size={16} /> : <Menu size={16} />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <div className="leading-none">
              <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">O Último Entardecer</h1>
              <span className="text-[10px] text-zinc-500">Romance · 4 capítulos · {totalWords} palavras</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Selection actions */}
          {selectedSpeeches.length > 0 && (
            <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <span className="text-[10px] text-amber-400 mr-1">{selectedSpeeches.length} selecionada(s)</span>
              <button className="p-1 text-amber-400 hover:text-amber-300" title="IA para seleção">
                <Sparkles size={13} />
              </button>
              <button className="p-1 text-amber-400 hover:text-amber-300" title="Gerar áudio da seleção">
                <Mic size={13} />
              </button>
              <button className="p-1 text-amber-400 hover:text-amber-300" title="Limpar seleção" onClick={() => setSelectedSpeeches([])}>
                <X size={13} />
              </button>
            </div>
          )}

          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg" title="Desfazer">
            <Undo size={15} />
          </button>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg" title="Refazer">
            <Redo size={15} />
          </button>
          <div className="h-5 w-px bg-zinc-800 mx-1" />
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={`p-1.5 rounded-lg transition-all ${focusMode ? "text-amber-400 bg-amber-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}
            title="Modo Foco"
          >
            {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg" title="Salvar">
            <Save size={15} />
          </button>
          <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg" title="Exportar">
            <Download size={15} />
          </button>
          <div className="h-5 w-px bg-zinc-800 mx-1" />
          <button 
            onClick={() => { setAiPanelOpen(!aiPanelOpen); setRightPanelOpen(true); setRightPanelTab("ai"); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              aiPanelOpen ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Sparkles size={13} />
            Assistente IA
          </button>
        </div>
      </header>

      {/* ─── MAIN AREA ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        {leftSidebarOpen && !focusMode && (
          <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col shrink-0 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            
            {/* Book structure */}
            <div className="flex-1 overflow-y-auto">
              {/* Chapters */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Capítulos</span>
                  <button className="p-1 text-zinc-600 hover:text-amber-400 rounded transition-colors" title="Novo capítulo">
                    <Plus size={13} />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {mockChapters.map((chapter) => (
                    <div key={chapter.id}>
                      <button
                        onClick={() => {
                          setSelectedChapter(chapter.id);
                          setExpandedChapters(prev => 
                            prev.includes(chapter.id) 
                              ? prev.filter(id => id !== chapter.id) 
                              : [...prev, chapter.id]
                          );
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-xs ${
                          selectedChapter === chapter.id
                            ? "bg-amber-500/10 text-amber-400"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {expandedChapters.includes(chapter.id) 
                          ? <ChevronDown size={12} className="shrink-0 text-zinc-600" />
                          : <ChevronRight size={12} className="shrink-0 text-zinc-600" />
                        }
                        <span className="truncate flex-1">{chapter.order}. {chapter.title}</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          chapter.status === "completed" ? "bg-emerald-500" :
                          chapter.status === "in_progress" ? "bg-amber-500" : "bg-zinc-600"
                        }`} />
                      </button>
                      
                      {/* Chapter stats when expanded */}
                      {expandedChapters.includes(chapter.id) && selectedChapter === chapter.id && (
                        <div className="ml-6 pl-2 border-l border-zinc-800 mt-1 mb-2 space-y-1">
                          <div className="text-[10px] text-zinc-600">{chapter.wordCount} palavras</div>
                          {chapter.id === "ch2" && speeches.map((s, i) => {
                            const char = mockCharacters.find(c => c.id === s.characterId);
                            return (
                              <button key={s.id} className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all text-left">
                                <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: char?.color }}>
                                  {char?.avatar}
                                </div>
                                <span className="truncate">{s.text.substring(0, 35)}...</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-zinc-800/50 mx-3" />

              {/* Characters */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Personagens</span>
                  <button className="p-1 text-zinc-600 hover:text-amber-400 rounded transition-colors" title="Novo personagem">
                    <Plus size={13} />
                  </button>
                </div>

                <div className="space-y-1">
                  {mockCharacters.map((char) => (
                    <button key={char.id} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all group">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: char.color }}
                      >
                        {char.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{char.name}</span>
                        <span className="block text-[10px] text-zinc-600">{char.voice}</span>
                      </div>
                      <Volume2 size={11} className="text-zinc-700 group-hover:text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-zinc-800/50 mx-3" />

              {/* Chapter tools */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Capítulo Atual</span>
                </div>
                <div className="space-y-1">
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                    <Music size={13} className="text-purple-400" />
                    <span>Trilha sonora</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                    <Mic size={13} className="text-emerald-400" />
                    <span>Narrar capítulo</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>IA no capítulo todo</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                    <Download size={13} className="text-blue-400" />
                    <span>Exportar áudio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom stats */}
            <div className="p-3 border-t border-zinc-800/50">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-zinc-800/30 rounded-lg py-1.5">
                  <div className="text-sm font-bold text-zinc-200">{speeches.length}</div>
                  <div className="text-[9px] text-zinc-600">Falas</div>
                </div>
                <div className="bg-zinc-800/30 rounded-lg py-1.5">
                  <div className="text-sm font-bold text-zinc-200">{totalWords}</div>
                  <div className="text-[9px] text-zinc-600">Palavras</div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ─── WRITING CANVAS ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          
          {/* Chapter header */}
          <div className="px-8 py-4 border-b border-zinc-800/30 bg-zinc-950" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Capítulo {currentChapter?.order}</div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{currentChapter?.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  currentChapter?.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                  currentChapter?.status === "in_progress" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {currentChapter?.status === "completed" ? "Concluído" : currentChapter?.status === "in_progress" ? "Em progresso" : "Rascunho"}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable writing area */}
          <div ref={canvasRef} className="flex-1 overflow-y-auto px-8 py-6" style={{ scrollBehavior: "smooth" }}>
            <div className="max-w-3xl mx-auto">
              
              {/* Speeches flowing like a book */}
              <div className="space-y-4">
                {speeches.map((speech) => {
                  const character = mockCharacters.find(c => c.id === speech.characterId);
                  return (
                    <SpeechBlock
                      key={speech.id}
                      speech={speech}
                      character={character}
                      isSelected={selectedSpeeches.includes(speech.id)}
                      isEditing={editingSpeech === speech.id}
                      editText={editText}
                      setEditText={setEditText}
                      onStartEdit={startEdit}
                      onCancelEdit={cancelEdit}
                      onSaveEdit={saveEdit}
                      selectedSpeeches={selectedSpeeches}
                      onToggleSelect={toggleSpeechSelect}
                    />
                  );
                })}
              </div>

              {/* New speech area */}
              {showNewSpeech ? (
                <div className="mt-6 border border-zinc-800 rounded-xl bg-zinc-900/30 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Personagem:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {mockCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => setNewSpeechChar(char.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
                            newSpeechChar === char.id
                              ? "ring-1 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                          style={newSpeechChar === char.id ? { 
                            backgroundColor: char.color + "22",
                            color: char.color,
                            ringColor: char.color
                          } : {}}
                        >
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: char.color }}>
                            {char.avatar}
                          </div>
                          {char.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <textarea
                    ref={newSpeechRef}
                    value={newSpeechText}
                    onChange={(e) => setNewSpeechText(e.target.value)}
                    placeholder="Escreva a nova fala..."
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-[15px] text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed"
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) addNewSpeech();
                      if (e.key === "Escape") setShowNewSpeech(false);
                    }}
                  />

                  {/* Tag toolbar for new speech */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-zinc-600 mr-1">Inserir:</span>
                    <TagButton icon={Clock} label="Pausa" tooltip="Inserir pausa" />
                    <TagButton icon={Megaphone} label="Ênfase" tooltip="Ênfase" />
                    <TagButton icon={ArrowUp} label="Tom ↑" tooltip="Tom alto" />
                    <TagButton icon={ArrowDown} label="Tom ↓" tooltip="Tom baixo" />
                    <TagButton icon={Zap} label="Sussurro" tooltip="Sussurro" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">Ctrl+Enter para adicionar · Esc para cancelar</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowNewSpeech(false)} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5">Cancelar</button>
                      <button 
                        onClick={addNewSpeech}
                        disabled={!newSpeechText.trim() || !newSpeechChar}
                        className="text-xs bg-amber-600 text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Adicionar fala
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowNewSpeech(true);
                    setTimeout(() => newSpeechRef.current?.focus(), 100);
                  }}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-600 hover:text-amber-400 hover:border-amber-500/30 transition-all group"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <span className="text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Nova fala</span>
                </button>
              )}

              {/* Bottom spacer */}
              <div className="h-32" />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="h-9 bg-zinc-900/50 border-t border-zinc-800/30 flex items-center justify-between px-4 shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
              <span>{speeches.length} falas</span>
              <span>{totalWords} palavras</span>
              <span>{speeches.filter(s => s.hasAudio).length}/{speeches.length} narradas</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Salvo
              </span>
              <span>⌘K Atalhos</span>
            </div>
          </div>
        </main>

        {/* ─── RIGHT PANEL ─── */}
        {rightPanelOpen && !focusMode && (
          <aside className="w-72 bg-zinc-900/50 border-l border-zinc-800/50 flex flex-col shrink-0 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            
            {/* Tab bar */}
            <div className="flex border-b border-zinc-800/50">
              {[
                { id: "ai", icon: Sparkles, label: "IA" },
                { id: "media", icon: Film, label: "Mídia" },
                { id: "props", icon: Settings, label: "Props" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRightPanelTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-all border-b-2 ${
                    rightPanelTab === tab.id 
                      ? "text-amber-400 border-amber-500" 
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
              <button onClick={() => setRightPanelOpen(false)} className="px-2 text-zinc-600 hover:text-zinc-300">
                <X size={14} />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === "ai" && (
                <AiChatPanel isOpen={true} onClose={() => setRightPanelOpen(false)} />
              )}

              {rightPanelTab === "media" && (
                <div className="p-3 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-300 mb-2">Mídia do Capítulo</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800/50 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all text-left">
                        <Music size={14} className="text-purple-400 shrink-0" />
                        <div>
                          <div className="text-zinc-300">Trilha Sonora</div>
                          <div className="text-[10px] text-zinc-600">Definir música de fundo do capítulo</div>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-800/50 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all text-left">
                        <Headphones size={14} className="text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-zinc-300">Áudio Ambiente</div>
                          <div className="text-[10px] text-zinc-600">Sons de fundo (chuva, floresta, cidade)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-800/50" />
                  
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-300 mb-2">Gerar para Fala Selecionada</h3>
                    <p className="text-[10px] text-zinc-600 mb-2">Selecione uma fala no texto para gerar mídia.</p>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                        <Camera size={13} className="text-blue-400" /> Gerar imagem da cena
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                        <Film size={13} className="text-orange-400" /> Gerar cena visual
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                        <Mic size={13} className="text-emerald-400" /> Gerar narração TTS
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                        <CloudRain size={13} className="text-cyan-400" /> Gerar áudio ambiente
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {rightPanelTab === "props" && (
                <div className="p-3 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-300 mb-2">Propriedades do Capítulo</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Título</label>
                        <input className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50" value={currentChapter?.title} readOnly />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Status</label>
                        <select className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50">
                          <option>Em progresso</option>
                          <option>Rascunho</option>
                          <option>Concluído</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-600 block mb-1">Notas do autor</label>
                        <textarea className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none" rows={3} placeholder="Anotações sobre este capítulo..." />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ─── GLOBAL STYLES ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,300;1,8..60,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #27272a transparent;
        }
        *::-webkit-scrollbar {
          width: 6px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 3px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }

        textarea::placeholder {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
