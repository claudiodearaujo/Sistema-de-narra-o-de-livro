# Writer's Studio — Guia de Execução

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- **Node.js**: v18+ (recomendado: v20)
- **npm**: v9+
- **Backend**: API rodando em `http://localhost:3000` (ou configurar `VITE_API_URL`)

### Instalação

```bash
# Navegar para o diretório do frontend
cd Frontend/WriterCenterFront

# Instalar dependências
npm install

# Verificar build
npm run build
```

### Desenvolvimento

```bash
# Rodar servidor de desenvolvimento
npm run dev

# Abrir no navegador
# http://localhost:5173
```

### Produção

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 🔧 Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# URL da API backend
VITE_API_URL=http://localhost:3000/api

# URL do WebSocket (opcional, usa mesma URL da API por padrão)
VITE_WS_URL=http://localhost:3000
```

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Configuração do app (router, providers)
├── features/              # Features principais
│   └── studio/           # Writer's Studio
│       ├── components/   # Componentes do Studio
│       │   ├── Canvas/  # Área de escrita
│       │   ├── LeftSidebar/
│       │   ├── RightPanel/
│       │   ├── TopBar/
│       │   └── StatusBar/
│       └── hooks/       # Hooks do Studio
├── shared/               # Código compartilhado
│   ├── api/            # Cliente HTTP, WebSocket, endpoints
│   ├── hooks/          # Hooks reutilizáveis
│   ├── stores/         # Zustand stores
│   ├── types/          # TypeScript types
│   ├── lib/            # Utilitários (toast, utils)
│   └── components/     # Componentes compartilhados
└── styles/             # Estilos globais
```

---

## 🎯 Funcionalidades Principais

### 1. Edição de Falas

- Clique no texto para editar
- `Ctrl+Enter` para salvar
- `Esc` para cancelar
- Tags SSML disponíveis na toolbar

### 2. Narração de Capítulos

- Botão "Narrar" na sidebar esquerda
- Progresso em tempo real via WebSocket
- Toasts de feedback
- Player de áudio inline quando completo

### 3. Geração de Mídia

- Botões de ação rápida em cada fala
- Gerar áudio TTS individual
- Gerar imagem da cena
- Gerar áudio ambiente

### 4. Atalhos de Teclado

- `Ctrl+S` — Salvar (placeholder)
- `Ctrl+B` — Toggle sidebar
- `Ctrl+Shift+A` — Painel IA
- `Ctrl+Shift+F` — Modo foco
- `Esc` — Cancelar edição

---

## 🔌 Integração com Backend

### Endpoints Necessários

O frontend espera os seguintes endpoints:

#### Autenticação
- `POST /oauth/authorize` — SSO OAuth
- `POST /oauth/token` — Token exchange
- `GET /oauth/userinfo` — User info

#### Livros
- `GET /books` — Listar livros
- `GET /books/:id` — Detalhes do livro
- `POST /books` — Criar livro
- `PATCH /books/:id` — Atualizar livro

#### Capítulos
- `GET /books/:bookId/chapters` — Listar capítulos
- `GET /chapters/:id` — Detalhes do capítulo
- `POST /books/:bookId/chapters` — Criar capítulo
- `PATCH /chapters/:id` — Atualizar capítulo
- `POST /chapters/:id/narration/start` — Iniciar narração
- `POST /chapters/:id/narration/cancel` — Cancelar narração

#### Falas
- `GET /chapters/:chapterId/speeches` — Listar falas
- `POST /speeches` — Criar fala
- `PATCH /speeches/:id` — Atualizar fala
- `DELETE /speeches/:id` — Excluir fala
- `PUT /chapters/:chapterId/speeches/reorder` — Reordenar
- `POST /speeches/:id/audio` — Gerar áudio
- `POST /speeches/:id/scene-image` — Gerar imagem

#### Personagens
- `GET /books/:bookId/characters` — Listar personagens
- `POST /characters` — Criar personagem
- `PATCH /characters/:id` — Atualizar personagem
- `DELETE /characters/:id` — Excluir personagem
- `POST /characters/:id/preview-audio` — Preview de voz

#### IA
- `POST /ai/chat` — Chat com IA

### WebSocket Events

O frontend escuta os seguintes eventos:

```typescript
// Narração iniciada
'narration:started' → {
  chapterId: string;
  totalSpeeches: number;
}

// Progresso de narração
'narration:progress' → {
  chapterId: string;
  speechId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  audioUrl?: string;
  error?: string;
}

// Narração concluída
'narration:completed' → {
  chapterId: string;
  totalAudios: number;
}

// Narração falhou
'narration:failed' → {
  chapterId: string;
  error: string;
}
```

---

## 🐛 Troubleshooting

### Build Errors

**Problema**: `Cannot find module 'react'`
**Solução**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript LSP Errors no IDE

**Problema**: IDE mostra erros mas build funciona
**Solução**: 
- Recarregar TypeScript server no VSCode (`Ctrl+Shift+P` → "Reload Window")
- Ou ignorar (são falsos positivos do LSP)

### WebSocket não conecta

**Problema**: Narração não inicia
**Solução**:
1. Verificar se backend está rodando
2. Verificar `VITE_WS_URL` no `.env`
3. Verificar console do navegador para erros

### Toasts não aparecem

**Problema**: Sem feedback visual
**Solução**:
1. Verificar se `<Toaster />` está no `App.tsx`
2. Verificar console para erros do Sonner
3. Verificar z-index do toast (deve ser > 50)

---

## 📚 Recursos Adicionais

### Documentação de Dependências

- [React](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Sonner](https://sonner.emilkowal.ski/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Scripts Úteis

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format

# Analyze bundle
npm run build -- --analyze
```

---

## 🎓 Próximos Passos

1. **Conectar ao Backend Real**
   - Configurar `.env` com URL da API
   - Testar autenticação OAuth
   - Testar WebSocket

2. **Testes de Usuário**
   - Criar livro de teste
   - Adicionar capítulos e falas
   - Testar narração end-to-end

3. **Refinamentos**
   - Implementar drag & drop
   - Criar editor de personagens
   - Adicionar testes automatizados

---

**Dúvidas?** Consulte `docs/SESSION_SUMMARY.md` para detalhes técnicos completos.
