# 🎧 Sistema de Narração de Livros - Prompts para Claude Opus 4.5

> **Autor:** Claudio - Desenvolvedor Full Stack @ Banco Daycoval  
> **Stack:** Angular 20 + Node.js + PostgreSQL + Gemini 2.5 Pro TTS

---

## ⚠️ GUARDRAIL CRÍTICO - TailwindCSS v4

**TODOS OS PROMPTS INCLUEM ESTA REGRA:**

```
⛔ NUNCA USE:
- tailwind.config.js ou tailwind.config.ts
- @tailwind base/components/utilities
- Configurações do TailwindCSS v3

✅ USE OBRIGATORIAMENTE:
- TailwindCSS v4 com @tailwindcss/postcss
- Configuração via .postcssrc
- @import "tailwindcss" no styles.css
```

---

## 🎨 Paleta de Cores - 5 Elementos

| Elemento | Cor Hex | CSS Variable | Uso |
|----------|---------|--------------|-----|
| 💧 Água | `#1E3A5F` | `--color-agua` | Headers, navegação |
| 🌳 Madeira | `#2D5A27` | `--color-madeira` | Sucesso, progresso |
| 🔥 Fogo | `#B45309` | `--color-fogo` | CTAs, alertas |
| 🏔️ Terra | `#78716C` | `--color-terra` | Textos secundários |
| ⚙️ Metal | `#334155` | `--color-metal` | Texto principal |
| 🎭 Voz | `#7C3AED` | `--color-accent` | Elementos de áudio |

---

## 📋 Prompts por Fase

### Fase 1: Setup e Infraestrutura (3-4 dias)

```markdown
Crie o setup completo para um sistema de narração de livros com as seguintes especificações:

## FRONTEND - Angular 20

### GUARDRAIL CRÍTICO - TailwindCSS v4
⛔ NUNCA USE:
- tailwind.config.js ou tailwind.config.ts
- @tailwind base/components/utilities
- Configurações do TailwindCSS v3

✅ USE OBRIGATORIAMENTE:
- TailwindCSS v4 com @tailwindcss/postcss
- Configuração via .postcssrc
- @import "tailwindcss" no styles.css

### Dependências exatas (package.json):
{
  "postcss": "^8.5.6",
  "postcss-cli": "^11.0.0",
  "primeicons": "^7.0.0",
  "primeng": "^20.3.0",
  "tailwindcss": "^4.1.17",
  "tailwindcss-primeui": "^0.6.1",
  "tw-animate-css": "^1.2.1",
  "@primeuix/themes": "^1.2.3",
  "@tailwindcss/postcss": "^4.1.12"
}

### Arquivo .postcssrc:
{
  "plugins": {
    "@tailwindcss/postcss": {},
    "autoprefixer": {}
  }
}

### styles.css (use CSS puro, não SCSS):
@import "tailwindcss";
@import "@primeuix/themes/aura/theme.css" layer(primeng);
@plugin "tailwindcss-primeui";
@custom-variant dark (&:is(.dark *));

### Paleta de cores (5 Elementos):
:root {
  --color-agua: #1E3A5F;
  --color-madeira: #2D5A27;
  --color-fogo: #B45309;
  --color-terra: #78716C;
  --color-metal: #334155;
  --color-accent: #7C3AED;
}

### app.config.ts:
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    providePrimeNG({
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          cssLayer: {
            name: 'primeng',
            order: "base,components,primeng"
          }
        }
      }
    })
  ]
};

## BACKEND - Node.js + TypeScript

Estrutura do projeto:
- src/
  - controllers/
  - services/
  - models/
  - routes/
  - middleware/
  - tts/ (camada de abstração)
  - utils/
- prisma/schema.prisma

## BANCO DE DADOS - PostgreSQL

Schema inicial com tabelas:
- books (id, title, author, description, cover_url, created_at, updated_at)
- chapters (id, book_id, title, order_index, status, created_at, updated_at)
- characters (id, book_id, name, voice_id, voice_description, preview_audio_url)
- speeches (id, chapter_id, character_id, text, ssml_text, order_index, audio_url)
- narrations (id, chapter_id, status, output_url, drive_file_id, created_at)

Gere todos os arquivos necessários para iniciar o projeto.
```

---

### Fase 2: Módulo de Livros (2-3 dias)

```markdown
Desenvolva o módulo completo de gerenciamento de livros para o sistema de narração.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## FRONTEND (Angular 20 + PrimeNG 20)

### Componentes necessários:
1. book-list.component.ts - Listagem com p-table do PrimeNG
   - Filtros por título e autor
   - Paginação server-side
   - Ações: visualizar, editar, excluir
   - Botão "Novo Livro"

2. book-form.component.ts - Formulário de cadastro/edição
   - Campos: título, autor, descrição (p-editor), capa (upload)
   - Validações reativas
   - Navegação após salvar

3. book-detail.component.ts - Visão detalhada do livro
   - Card com informações do livro
   - Lista de capítulos (mini-lista)
   - Lista de personagens (mini-lista)
   - Estatísticas: total de capítulos, falas, tempo estimado

### Services:
- book.service.ts com métodos: getAll, getById, create, update, delete, getStats

### Styling:
Use as cores da paleta dos 5 elementos:
- Headers em --color-agua (#1E3A5F)
- Botões de sucesso em --color-madeira (#2D5A27)
- Alertas em --color-fogo (#B45309)
- Textos secundários em --color-terra (#78716C)
- Accent em --color-accent (#7C3AED)

## BACKEND (Node.js)

### Endpoints REST:
- GET /api/books (com paginação e filtros)
- GET /api/books/:id
- POST /api/books
- PUT /api/books/:id
- DELETE /api/books/:id
- GET /api/books/:id/stats

### Validações:
- Título obrigatório, mínimo 3 caracteres
- Autor obrigatório

Gere código completo e funcional com tratamento de erros.
```

---

### Fase 3: Módulo de Capítulos (2-3 dias)

```markdown
Desenvolva o módulo de capítulos vinculados a livros.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## FRONTEND (Angular 20 + PrimeNG 20)

### Componentes:
1. chapter-list.component.ts
   - Lista ordenável com drag-and-drop (p-orderlist ou CDK drag-drop)
   - Status visual: DRAFT (cinza), IN_PROGRESS (amarelo), COMPLETED (verde)
   - Ações: editar, excluir, gerar narração
   - Contador de falas por capítulo

2. chapter-form.component.ts
   - Campos: título, ordem (auto-incremento)
   - Modal dialog do PrimeNG

3. chapter-detail.component.ts
   - Informações do capítulo
   - Lista de falas (preview)
   - Botão "Gerar Narração" (desabilitado se não houver falas)
   - Player de áudio se narração existir

### Services:
- chapter.service.ts: CRUD + reorder + getByBook

### Status enum:
enum ChapterStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed'
}

## BACKEND (Node.js)

### Endpoints:
- GET /api/books/:bookId/chapters
- GET /api/chapters/:id
- POST /api/books/:bookId/chapters
- PUT /api/chapters/:id
- DELETE /api/chapters/:id
- PUT /api/books/:bookId/chapters/reorder (body: {orderedIds: string[]})

### Regras:
- Ao criar capítulo, auto-incrementar order_index
- Ao reordenar, atualizar order_index de todos os afetados
- Não permitir excluir capítulo com narração concluída (ou confirmar)

Gere código completo seguindo os padrões estabelecidos na Fase 1 e 2.
```

---

### Fase 4: Módulo de Personagens (3-4 dias)

```markdown
Desenvolva o módulo de personagens com vinculação de vozes TTS.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## FRONTEND (Angular 20 + PrimeNG 20)

### Componentes:
1. character-list.component.ts
   - Cards de personagens com avatar placeholder
   - Badge com nome da voz selecionada
   - Botão de preview de voz
   - Grid responsivo

2. character-form.component.ts
   - Nome do personagem
   - Dropdown de vozes disponíveis (do Gemini TTS)
   - Campo de descrição vocal (textarea)
     - Placeholder: "Ex: Tom grave, sotaque nordestino, fala pausada..."
   - Botão "Testar Voz" integrado

3. voice-preview.component.ts
   - Componente reutilizável de preview
   - Input de texto para teste (default: nome do personagem)
   - Botão play/stop
   - Indicador de loading durante geração
   - Player de áudio inline

### Vozes Gemini 2.5 Pro TTS (buscar da API):
- Implementar cache das vozes disponíveis
- Agrupar por idioma/gênero se disponível
- Mostrar características da voz (se a API fornecer)

### Services:
- character.service.ts: CRUD + previewVoice
- voice.service.ts: getAvailableVoices, previewVoice

## BACKEND (Node.js)

### Endpoints:
- GET /api/books/:bookId/characters
- GET /api/characters/:id
- POST /api/books/:bookId/characters
- PUT /api/characters/:id
- DELETE /api/characters/:id
- GET /api/voices (lista vozes disponíveis do Gemini)
- POST /api/voices/preview (body: {voiceId, text})

### Integração Gemini TTS:
- Usar SDK oficial do Google AI
- Endpoint de preview deve retornar audio base64 ou URL temporária
- Cachear lista de vozes por 24h

### Model Character:
{
  id: string,
  bookId: string,
  name: string,
  voiceId: string,
  voiceDescription: string,
  previewAudioUrl?: string
}

Gere código completo com integração real ao Gemini 2.5 Pro TTS.
```

---

### Fase 5: Módulo de Falas (4-5 dias)

```markdown
Desenvolva o módulo de cadastro de falas com suporte SSML e importação em massa.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## FRONTEND (Angular 20 + PrimeNG 20)

### Componentes:
1. speech-list.component.ts
   - Lista ordenável de falas do capítulo
   - Drag-and-drop para reordenação
   - Preview do texto (truncado)
   - Badge do personagem com cor
   - Botão de edição inline

2. speech-form.component.ts (modal ou inline)
   - Dropdown de personagens do livro
   - Editor de texto com suporte SSML
   - Preview do SSML renderizado
   - Validação de tags SSML

3. ssml-editor.component.ts
   - Textarea com syntax highlighting para SSML
   - Toolbar com botões de inserção:
     - <break time="500ms"/>
     - <emphasis level="strong">
     - <prosody rate="slow" pitch="+2st">
     - <say-as interpret-as="cardinal">
   - Preview em tempo real da estrutura

4. bulk-import.component.ts
   - Modal de importação em massa
   - Textarea para colar texto completo
   - Opções de divisão:
     - Por parágrafos (\n\n)
     - Por frases (. ou !)
     - Por diálogos (" ou -)
   - Preview da divisão antes de confirmar
   - Seleção de personagem padrão
   - Possibilidade de atribuir personagens após divisão

### Services:
- speech.service.ts: CRUD + reorder + bulkCreate
- ssml.service.ts: validate, parse, preview

## BACKEND (Node.js)

### Endpoints:
- GET /api/chapters/:chapterId/speeches
- GET /api/speeches/:id
- POST /api/chapters/:chapterId/speeches
- PUT /api/speeches/:id
- DELETE /api/speeches/:id
- PUT /api/chapters/:chapterId/speeches/reorder
- POST /api/chapters/:chapterId/speeches/bulk
- POST /api/ssml/validate (body: {ssmlText})

### Model Speech:
{
  id: string,
  chapterId: string,
  characterId: string,
  text: string,
  ssmlText?: string,
  orderIndex: number,
  audioUrl?: string,
  duration?: number
}

### Bulk Import Logic:
1. Receber texto completo
2. Dividir conforme estratégia selecionada
3. Criar speeches com personagem padrão
4. Retornar array de speeches criados

### Validação SSML:
- Verificar tags permitidas pelo Gemini TTS
- Validar estrutura XML
- Retornar erros específicos por posição

Gere código completo com editor SSML funcional.
```

---

### Fase 6: Camada de Abstração TTS (3-4 dias)

```markdown
Desenvolva a camada de abstração para múltiplos providers TTS.

## ARQUITETURA

### Interface Base (src/tts/interfaces/tts-provider.interface.ts):
export interface VoiceConfig {
  voiceId: string;
  description?: string;
  languageCode?: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

export interface Voice {
  id: string;
  name: string;
  languageCode: string;
  gender: string;
  provider: string;
  previewUrl?: string;
}

export interface GenerateAudioOptions {
  text: string;
  voice: VoiceConfig;
  useSSML?: boolean;
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac';
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
}

export interface AudioResult {
  buffer: Buffer;
  format: string;
  duration?: number;
  sampleRate?: number;
}

export interface TTSProvider {
  readonly name: string;
  readonly supportedFormats: string[];
  
  initialize(): Promise<void>;
  generateAudio(options: GenerateAudioOptions): Promise<AudioResult>;
  getAvailableVoices(): Promise<Voice[]>;
  previewVoice(voiceId: string, sampleText?: string): Promise<AudioResult>;
  validateSSML(ssml: string): Promise<{valid: boolean; errors?: string[]}>;
}

### Implementação Gemini (src/tts/providers/gemini-tts.provider.ts):
- Usar @google/generative-ai ou API REST direta
- Implementar todos os métodos da interface
- Cachear vozes disponíveis
- Tratar rate limiting com exponential backoff
- Logging detalhado de erros

### Factory Pattern (src/tts/tts.factory.ts):
export class TTSFactory {
  static create(provider: 'gemini' | 'elevenlabs' | 'aws' | 'azure'): TTSProvider;
  static getDefault(): TTSProvider;
}

### Service Layer (src/tts/tts.service.ts):
- Singleton com provider configurável
- Métodos de alto nível para uso nos controllers
- Queue integration para processamento em batch
- Metrics e logging

### Configuração (src/tts/tts.config.ts):
export interface TTSConfig {
  defaultProvider: string;
  providers: {
    gemini?: { apiKey: string; model?: string };
    elevenlabs?: { apiKey: string };
    // ...outros
  };
  defaultOutputFormat: string;
  maxRetries: number;
  cacheVoicesTTL: number;
}

### Preparação para outros providers:
- Criar stubs para ElevenLabs, AWS Polly, Azure Speech
- Documentar interface para implementação futura

## TESTES
- Testes unitários para cada provider
- Mocks para APIs externas
- Testes de integração com Gemini real (opcional, via env)

Gere código TypeScript completo com tipagem forte e tratamento de erros robusto.
```

---

### Fase 7: Geração de Narração (4-5 dias)

```markdown
Desenvolva o módulo de geração de narração com processamento em fila.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## BACKEND (Node.js)

### Sistema de Filas (Bull/BullMQ):
1. narration-queue.ts
   - Fila para jobs de geração
   - Configuração de concorrência (1-3 paralelos)
   - Retry automático com backoff exponencial
   - Dead letter queue para falhas

2. narration-processor.ts
   - Worker que processa jobs
   - Para cada speech do capítulo:
     a. Buscar personagem e voz
     b. Gerar áudio via TTS Provider
     c. Salvar áudio temporário
     d. Atualizar speech.audioUrl
     e. Emitir progresso via WebSocket
   - Ao final: disparar job de pós-processamento

3. narration.service.ts
   - startNarration(chapterId): adiciona job à fila
   - getNarrationStatus(chapterId): retorna progresso
   - cancelNarration(chapterId): cancela job em andamento
   - retryNarration(chapterId): retry de falhas

### Endpoints:
- POST /api/chapters/:id/narration/start
- GET /api/chapters/:id/narration/status
- POST /api/chapters/:id/narration/cancel
- POST /api/chapters/:id/narration/retry

### WebSocket Events:
- narration:started { chapterId, totalSpeeches }
- narration:progress { chapterId, current, total, speechId }
- narration:speech-completed { chapterId, speechId, audioUrl }
- narration:completed { chapterId }
- narration:failed { chapterId, error, failedSpeechId }

### Model Narration:
{
  id: string,
  chapterId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number, // 0-100
  currentSpeechIndex: number,
  totalSpeeches: number,
  startedAt: Date,
  completedAt?: Date,
  error?: string,
  outputUrl?: string
}

## FRONTEND (Angular 20)

### Componentes:
1. narration-control.component.ts
   - Botão "Gerar Narração" (disabled se sem falas)
   - Progress bar durante geração
   - Lista de falas com status individual
   - Botão cancelar
   - Toast de conclusão/erro

2. narration-progress.component.ts
   - Barra de progresso animada
   - Texto: "Processando fala X de Y"
   - Tempo estimado restante
   - Lista de falas: ✓ concluídas, ⏳ atual, ○ pendentes

### Services:
- narration.service.ts: start, getStatus, cancel
- websocket.service.ts: conexão e eventos

Gere código completo com WebSocket funcional e feedback em tempo real.
```

---

### Fase 8: Pós-processamento de Áudio (3-4 dias)

```markdown
Desenvolva o módulo de pós-processamento de áudio e upload para Google Drive.

## BACKEND (Node.js)

### Dependências:
- fluent-ffmpeg (para processamento de áudio)
- googleapis (para Google Drive API)

### Audio Processing Service (src/audio/audio-processor.service.ts):
1. concatenateAudios(audioUrls: string[]): Promise<Buffer>
   - Concatenar múltiplos arquivos de áudio
   - Inserir silêncio configurável entre falas (default: 500ms)
   - Manter qualidade original

2. normalizeAudio(buffer: Buffer): Promise<Buffer>
   - Normalização de volume (target: -16 LUFS para audiobooks)
   - Limitar picos (true peak: -1 dB)
   - Usar filtro loudnorm do ffmpeg

3. convertToFormat(buffer: Buffer, format: 'mp3' | 'aac'): Promise<Buffer>
   - MP3: 128-192 kbps, mono ou stereo
   - AAC: 128 kbps, otimizado para audiobooks
   - Metadata: título do capítulo, autor, livro

4. addChapterMetadata(buffer: Buffer, metadata: AudioMetadata): Promise<Buffer>
   - ID3 tags para MP3
   - Capa do livro como artwork

### Google Drive Service (src/storage/google-drive.service.ts):
1. Autenticação:
   - Service Account ou OAuth2
   - Configuração via variáveis de ambiente

2. upload(buffer: Buffer, filename: string, folderId?: string): Promise<DriveFile>
   - Upload com resumable para arquivos grandes
   - Retornar webViewLink e webContentLink

3. createFolder(name: string, parentId?: string): Promise<string>
   - Estrutura: /Audiobooks/{Livro}/{Capítulos}

4. getOrCreateBookFolder(bookTitle: string): Promise<string>
   - Criar estrutura de pastas se não existir

5. setPermissions(fileId: string, permission: 'private' | 'link'): Promise<void>

### Post-Processing Job:
1. Buscar todos os áudios de falas do capítulo
2. Concatenar na ordem correta
3. Normalizar volume
4. Converter para formato desejado (MP3/AAC)
5. Adicionar metadata
6. Upload para Google Drive
7. Atualizar narration.outputUrl e driveFileId

### Endpoints:
- POST /api/chapters/:id/audio/process (trigger manual)
- GET /api/chapters/:id/audio/download (proxy ou redirect)
- GET /api/chapters/:id/audio/stream

### Configuração:
{
  audio: {
    silenceBetweenSpeeches: 500, // ms
    outputFormat: 'mp3',
    mp3Bitrate: 192,
    targetLoudness: -16, // LUFS
  },
  googleDrive: {
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT,
    rootFolderId: process.env.DRIVE_ROOT_FOLDER,
    defaultPermission: 'private'
  }
}

## FRONTEND

### Componentes:
1. audio-player.component.ts
   - Player customizado para o capítulo
   - Waveform visualization (opcional)
   - Download button
   - Compartilhar link do Drive

2. export-options.component.ts
   - Seleção de formato (MP3/AAC)
   - Qualidade (alta/média/baixa)
   - Destino (download local / Google Drive)

Gere código completo com ffmpeg funcional e integração Google Drive.
```

---

### Fase 9: Polimento e Testes (3-4 dias)

```markdown
Finalize o sistema com testes, documentação e deploy.

## GUARDRAIL - TailwindCSS v4
⛔ NÃO USE tailwind.config.js - o projeto usa TailwindCSS v4 com @tailwindcss/postcss

## TESTES

### Frontend (Angular - Jest/Karma):
1. Testes unitários para services
2. Testes de componentes com TestBed
3. Testes e2e com Cypress ou Playwright
4. Coverage mínimo: 80%

### Backend (Node.js - Jest):
1. Testes unitários para services
2. Testes de integração para controllers
3. Mocks para APIs externas (Gemini, Google Drive)
4. Testes de fila (Bull)
5. Coverage mínimo: 80%

### Testes E2E críticos:
- Fluxo completo: criar livro → capítulo → personagem → falas → gerar narração
- Upload para Google Drive
- Importação em massa de falas

## ACESSIBILIDADE (WCAG 2.1 AA)

### Checklist:
- Contraste de cores adequado
- Labels em todos os inputs
- Navegação por teclado
- ARIA labels onde necessário
- Skip links
- Focus visible
- Screen reader friendly

## RESPONSIVIDADE

### Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Ajustes por breakpoint:
- Sidebar colapsável em mobile
- Tables → Cards em mobile
- Modal fullscreen em mobile

## DOCUMENTAÇÃO

### README.md principal:
- Visão geral do projeto
- Stack tecnológico
- Requisitos (Node, Angular, PostgreSQL)
- Instruções de setup
- Variáveis de ambiente
- Comandos disponíveis

### docs/API.md:
- Documentação OpenAPI/Swagger
- Exemplos de requests/responses
- Códigos de erro

### docs/ARCHITECTURE.md:
- Diagrama de arquitetura
- Fluxo de dados
- Decisões técnicas

### docs/DEPLOYMENT.md:
- Deploy do backend (Render, Railway, etc.)
- Deploy do frontend (Vercel, Netlify)
- Configuração de CI/CD (GitHub Actions)

## CI/CD (GitHub Actions)

### Workflows:
1. ci.yml - Pull Requests:
   - Lint
   - Testes unitários
   - Build

2. deploy-staging.yml - Branch develop:
   - Build
   - Deploy para staging
   - Testes e2e

3. deploy-production.yml - Branch main:
   - Build
   - Deploy para produção
   - Smoke tests

## PERFORMANCE

### Frontend:
- Lazy loading de módulos
- OnPush change detection
- Virtual scrolling para listas grandes
- Image optimization

### Backend:
- Connection pooling PostgreSQL
- Redis cache para vozes
- Compression middleware
- Rate limiting

## MONITORAMENTO

### Sugestões:
- Sentry para error tracking
- LogRocket ou similar para session replay
- Métricas customizadas para:
  - Tempo de geração de narração
  - Taxa de sucesso/falha TTS
  - Uso de storage

Gere arquivos de configuração e documentação completos.
```

---

## 📅 Cronograma Estimado

| Fase | Descrição | Duração | Acumulado |
|------|-----------|---------|-----------|
| 1 | Setup e Infraestrutura | 3-4 dias | 4 dias |
| 2 | Módulo de Livros | 2-3 dias | 7 dias |
| 3 | Módulo de Capítulos | 2-3 dias | 10 dias |
| 4 | Módulo de Personagens | 3-4 dias | 14 dias |
| 5 | Módulo de Falas + SSML | 4-5 dias | 19 dias |
| 6 | Camada de Abstração TTS | 3-4 dias | 23 dias |
| 7 | Geração de Narração | 4-5 dias | 28 dias |
| 8 | Pós-processamento de Áudio | 3-4 dias | 32 dias |
| 9 | Polimento e Testes | 3-4 dias | **35-36 dias** |

**Total estimado: 7-8 semanas**

---

## 💡 Dicas de Uso

1. **Execute sequencialmente** - Cada fase depende da anterior
2. **Valide antes de prosseguir** - Teste cada módulo antes de avançar
3. **Use o contexto** - Ao iniciar uma nova fase, mencione as anteriores
4. **Guardrail é lei** - O TailwindCSS v4 está em TODOS os prompts por um motivo
5. **Adapte** - Ajuste os prompts conforme necessidades específicas

---

*Documento gerado para uso com Claude Opus 4.5*  
*Claudio - Desenvolvedor Full Stack @ Banco Daycoval*
