# 📚 Sistema Livria - Documentação de Arquitetura

> **Última atualização:** 30 de Dezembro de 2025  
> **Versão do Sistema:** 1.0.0  
> **Status:** Em Desenvolvimento Ativo

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Backend - Estrutura e Funcionalidades](#backend---estrutura-e-funcionalidades)
5. [Frontend - Estrutura e Funcionalidades](#frontend---estrutura-e-funcionalidades)
6. [Banco de Dados](#banco-de-dados)
7. [Sistema de Autenticação](#sistema-de-autenticação)
8. [Sistema de IA e TTS](#sistema-de-ia-e-tts)
9. [Filas e Processamento Assíncrono](#filas-e-processamento-assíncrono)
10. [WebSocket e Tempo Real](#websocket-e-tempo-real)
11. [Variáveis de Ambiente](#variáveis-de-ambiente)
12. [Endpoints da API](#endpoints-da-api)
13. [Módulos Futuros Planejados](#módulos-futuros-planejados)
14. [Problemas Conhecidos](#problemas-conhecidos)
15. [Próximos Passos Sugeridos](#próximos-passos-sugeridos)

---

## Visão Geral

O **Sistema Livria** é uma plataforma de narração de livros com geração de áudio por IA (Text-to-Speech). O sistema permite que escritores criem livros, definam personagens com vozes únicas, e gerem narrações em áudio de alta qualidade para cada capítulo.

### Objetivos Principais

- Criar e gerenciar livros e capítulos
- Definir personagens com fichas completas e vozes customizadas
- Gerar áudio TTS com diferentes vozes para cada personagem
- Suporte a múltiplos provedores de IA (Gemini, OpenAI, etc.)
- Sistema de filas para processamento assíncrono de áudio
- Arquitetura modular para expansão futura (Rede Social, etc.)

---

## Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 22.x | Runtime |
| TypeScript | 5.9.3 | Linguagem |
| Express | 5.2.1 | Framework HTTP |
| Prisma | 7.2.0 | ORM |
| PostgreSQL | 15+ | Banco de Dados (Supabase) |
| Redis | 7.x | Cache e Filas |
| BullMQ | 5.65.1 | Gerenciamento de Filas |
| Socket.IO | 4.8.1 | WebSocket |
| JSON Web Token | 9.0.3 | Autenticação |
| bcryptjs | 3.0.3 | Hash de Senhas |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Angular | 20.1.0 | Framework |
| TypeScript | 5.x | Linguagem |
| PrimeNG | 20.3.0 | UI Components |
| Tailwind CSS | 4.1.17 | Estilização |
| RxJS | 7.8.0 | Programação Reativa |
| Socket.IO Client | 4.8.1 | WebSocket Client |
| Chart.js | 4.5.1 | Gráficos |
| Quill | 2.0.3 | Editor Rich Text |

### Serviços de IA

| Provedor | Modelos | Uso |
|----------|---------|-----|
| Google Gemini | gemini-2.5-flash | Geração de Texto |
| Google Gemini | gemini-2.5-flash-image | Geração de Imagens |
| Google Gemini | gemini-2.5-flash-preview-tts | Text-to-Speech (30 vozes) |

### Infraestrutura

| Serviço | Uso |
|---------|-----|
| Supabase | PostgreSQL hospedado (PgBouncer porta 6543, Direct porta 5432) |
| Redis (local) | Filas e cache |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                     Angular 20 + PrimeNG                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Módulos:                                                     │   │
│  │  - Auth (login, signup, profile, forgot-password)            │   │
│  │  - Writer (books, chapters, characters, voices, dashboard)   │   │
│  │  - Social (futuro)                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼ HTTP / WebSocket                      │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
│                   Node.js + Express + TypeScript                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  API Routes:                                                  │   │
│  │  - /api/auth/* (autenticação)                                │   │
│  │  - /api/books/* (livros)                                     │   │
│  │  - /api/chapters/* (capítulos)                               │   │
│  │  - /api/characters/* (personagens)                           │   │
│  │  - /api/voices/* (vozes Gemini)                              │   │
│  │  - /api/custom-voices/* (vozes customizadas)                 │   │
│  │  - /api/speeches/* (falas)                                   │   │
│  │  - /api/narration/* (narrações)                              │   │
│  │  - /api/audio/* (processamento de áudio)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │
│  │   Services    │   │   AI Module   │   │   Queue Processors    │  │
│  │  - auth       │   │  - gemini-tts │   │  - narration.queue    │  │
│  │  - books      │   │  - gemini-text│   │  - audio.queue        │  │
│  │  - chapters   │   │  - gemini-img │   │  - narration.processor│  │
│  │  - characters │   │  - ai.factory │   └───────────────────────┘  │
│  │  - speeches   │   └───────────────┘              │               │
│  │  - narration  │          │                       │               │
│  └───────────────┘          │                       ▼               │
│         │                   │              ┌────────────────┐       │
│         ▼                   ▼              │     Redis      │       │
│  ┌─────────────────────────────────────┐   │   (BullMQ)     │       │
│  │          Prisma ORM                 │   └────────────────┘       │
│  └─────────────────────────────────────┘                            │
│                    │                                                 │
└────────────────────│─────────────────────────────────────────────────┘
                     ▼
          ┌─────────────────────┐
          │   PostgreSQL        │
          │   (Supabase)        │
          └─────────────────────┘
```

---

## Backend - Estrutura e Funcionalidades

### Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma          # Modelo de dados
│   ├── seed.ts                # Seed do banco (usuário admin)
│   └── migrations/            # Migrações do banco
├── src/
│   ├── index.ts               # Entry point do servidor
│   ├── ai/                    # Módulo de IA
│   │   ├── ai.config.ts       # Configuração multi-provider
│   │   ├── ai.factory.ts      # Factory para criar providers
│   │   ├── ai.service.ts      # Serviço unificado de IA
│   │   ├── interfaces/        # Interfaces de IA
│   │   └── providers/
│   │       ├── gemini-text.provider.ts
│   │       ├── gemini-image.provider.ts
│   │       └── gemini-tts.provider.ts
│   ├── controllers/           # Controllers HTTP
│   │   ├── auth.controller.ts
│   │   └── ...
│   ├── middleware/
│   │   └── auth.middleware.ts # authenticate, authorize, optionalAuth
│   ├── models/                # Modelos auxiliares
│   ├── queues/
│   │   ├── narration.queue.ts    # Fila de narração
│   │   ├── narration.processor.ts # Processador de narração
│   │   └── audio.queue.ts        # Fila de áudio
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── books.routes.ts
│   │   ├── chapters.routes.ts
│   │   ├── characters.routes.ts
│   │   ├── voices.routes.ts
│   │   ├── custom-voices.routes.ts
│   │   ├── speeches.routes.ts
│   │   ├── narration.routes.ts
│   │   └── audio.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── books.service.ts
│   │   ├── chapters.service.ts
│   │   ├── characters.service.ts
│   │   ├── speeches.service.ts
│   │   ├── narration.service.ts
│   │   ├── audio-processor.service.ts
│   │   ├── speech-assist.service.ts
│   │   └── google-drive.service.ts
│   ├── utils/
│   │   ├── jwt.utils.ts       # Geração/verificação de JWT
│   │   └── password.utils.ts  # Hash de senhas
│   └── websocket/
│       └── websocket.server.ts
└── uploads/
    ├── audio/                 # Áudios gerados
    ├── previews/              # Previews de voz
    └── speeches/              # Falas individuais
```

### Funcionalidades Implementadas

#### Autenticação (✅ Completo)
- Registro de usuários com validação
- Login com JWT (access token + refresh token)
- Logout com invalidação de tokens
- Refresh de tokens
- Recuperação de senha (estrutura pronta, envio de email pendente)
- Verificação de email (estrutura pronta)
- Perfil do usuário (visualização e edição)
- Alteração de senha
- Upload de avatar (estrutura pronta)

#### Livros (✅ Completo)
- CRUD completo de livros
- Associação com usuário (owner)
- Capa do livro

#### Capítulos (✅ Completo)
- CRUD completo de capítulos
- Ordenação por orderIndex
- Status (draft, in_progress, completed)

#### Personagens (✅ Completo)
- CRUD completo de personagens
- Associação de voz a cada personagem
- Preview de áudio da voz
- Ficha completa com:
  - Identity (gênero, idade, nacionalidade, ocupação, personalidade)
  - Physique (altura, peso, tipo corporal, tom de pele, cicatrizes, tatuagens)
  - Face (formato do rosto, nariz, lábios, expressão, barba)
  - Eyes (cor, formato, cílios, sobrancelhas, óculos)
  - Hair (corte, comprimento, cor, textura, estilo)
  - Wardrobe (estilo, roupas, calçados, acessórios)

#### Vozes (✅ Completo)
- Listagem de 30 vozes do Gemini TTS
- Vozes customizadas (CRUD)
- Preview de voz com texto de exemplo
- Filtro por gênero (MALE, FEMALE)

#### Falas/Speeches (✅ Completo)
- CRUD de falas por capítulo
- Associação com personagem
- Suporte a SSML
- Geração de áudio individual

#### Narração (✅ Completo)
- Fila de processamento com BullMQ
- Geração de áudio para capítulo completo
- Concatenação de áudios
- Upload para Google Drive (opcional)
- WebSocket para progresso em tempo real

---

## Frontend - Estrutura e Funcionalidades

### Estrutura de Pastas

```
frontend/src/app/
├── app.config.ts              # Configuração do app
├── app.routes.ts              # Rotas principais
├── core/
│   ├── auth/
│   │   ├── guards/
│   │   │   └── auth.guard.ts  # Proteção de rotas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts  # Adiciona JWT às requisições
│   │   ├── models/
│   │   │   └── user.model.ts  # Interfaces de usuário
│   │   └── services/
│   │       └── auth.service.ts  # Serviço de autenticação (Signals)
│   ├── models/                # Modelos compartilhados
│   └── services/              # Serviços compartilhados
├── features/
│   ├── auth/
│   │   ├── login/             # Tela de login
│   │   ├── signup/            # Tela de cadastro
│   │   ├── profile/           # Tela de perfil
│   │   ├── forgot-password/   # Recuperação de senha
│   │   ├── unauthorized/      # Tela de acesso negado
│   │   └── auth.routes.ts     # Rotas do módulo auth
│   ├── writer/
│   │   └── writer.routes.ts   # Rotas do módulo escritor
│   ├── books/
│   │   ├── book-list/         # Lista de livros
│   │   ├── book-form/         # Formulário de livro
│   │   └── book-detail/       # Detalhes do livro
│   ├── chapters/
│   │   ├── chapter-list/      # Lista de capítulos
│   │   ├── chapter-detail/    # Detalhes do capítulo (editor)
│   │   ├── chapter-form/      # Formulário de capítulo
│   │   ├── narration-control/ # Controle de narração
│   │   ├── audio-player/      # Player de áudio
│   │   └── export-options/    # Opções de exportação
│   ├── characters/
│   │   ├── character-list/    # Lista de personagens
│   │   ├── character-form/    # Formulário de personagem
│   │   └── voice-preview/     # Preview de voz
│   ├── voices/
│   │   └── voice-list/        # Lista de vozes
│   ├── speeches/
│   │   └── speech-form/       # Formulário de falas
│   └── dashboard/
│       └── dashboard.component  # Dashboard principal
├── layouts/
│   ├── auth-layout/           # Layout para páginas de auth
│   └── main-layout/           # Layout principal (menu, header)
├── models/
│   ├── book.model.ts
│   └── chapter.model.ts
├── services/
│   ├── book.service.ts
│   ├── chapter.service.ts
│   ├── character.service.ts
│   ├── voice.service.ts
│   ├── custom-voice.service.ts
│   ├── speech.service.ts
│   ├── narration.service.ts
│   ├── ssml.service.ts
│   └── websocket.service.ts
└── shared/                    # Componentes compartilhados
```

### Arquitetura Angular

- **Standalone Components**: Todos os componentes são standalone (Angular 20)
- **Signals**: Usado para estado reativo no AuthService
- **Lazy Loading**: Módulos carregados sob demanda
- **Guards**: Proteção de rotas com auth.guard
- **Interceptors**: Adição automática de JWT

### Estrutura de Rotas

```typescript
/ → redirectTo: /writer
/auth/login
/auth/signup
/auth/forgot-password
/auth/profile (protegido)
/unauthorized
/writer (protegido) → MainLayout
  /writer → Dashboard
  /writer/books → BookList
  /writer/books/new → BookForm
  /writer/books/:id → BookDetail
  /writer/books/:id/edit → BookForm
  /writer/books/:id/characters → CharacterList
  /writer/chapters/:id → ChapterDetail
  /writer/characters → CharacterList
  /writer/voices → VoiceList
```

---

## Banco de Dados

### Modelos Principais

#### User
```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String?      // Null para OAuth
  name          String
  username      String?      @unique
  avatar        String?
  bio           String?
  role          UserRole     @default(USER)  // USER, WRITER, ADMIN
  isVerified    Boolean      @default(false)
  provider      AuthProvider @default(LOCAL)  // LOCAL, GOOGLE, GITHUB
  providerId    String?
  verifyToken   String?
  verifyExpires DateTime?
  resetToken    String?
  resetExpires  DateTime?
  books         Book[]
  refreshTokens RefreshToken[]
}
```

#### Book
```prisma
model Book {
  id          String    @id @default(uuid())
  title       String
  author      String
  description String?
  coverUrl    String?
  userId      String?   // Owner
  chapters    Chapter[]
  characters  Character[]
}
```

#### Chapter
```prisma
model Chapter {
  id         String    @id @default(uuid())
  bookId     String
  title      String
  orderIndex Int
  status     String    @default("draft")  // draft, in_progress, completed
  speeches   Speech[]
  narration  Narration?
}
```

#### Character
```prisma
model Character {
  id              String   @id @default(uuid())
  bookId          String
  name            String
  voiceId         String
  voiceDescription String?
  previewAudioUrl String?
  speeches        Speech[]
  // Relações para ficha completa
  identity        CharacterIdentity?
  physique        CharacterPhysique?
  face            CharacterFace?
  eyes            CharacterEyes?
  hair            CharacterHair?
  wardrobe        CharacterWardrobe?
}
```

#### Speech
```prisma
model Speech {
  id          String   @id @default(uuid())
  chapterId   String
  characterId String
  text        String
  ssmlText    String?
  orderIndex  Int
  audioUrl    String?
}
```

#### Narration
```prisma
model Narration {
  id          String   @id @default(uuid())
  chapterId   String   @unique
  status      String   // pending, processing, completed, failed
  outputUrl   String?
  driveFileId String?
}
```

#### CustomVoice
```prisma
model CustomVoice {
  id           String   @id @default(uuid())
  name         String   @unique
  gender       String   // MALE, FEMALE, NEUTRAL
  languageCode String
  description  String?
  provider     String   @default("custom")
  voiceId      String
  isActive     Boolean  @default(true)
}
```

---

## Sistema de Autenticação

### Fluxo de Autenticação

```
┌─────────┐     POST /api/auth/login      ┌─────────┐
│ Frontend│ ─────────────────────────────▶│ Backend │
│         │   {email, password}           │         │
│         │                               │         │
│         │◀─────────────────────────────│         │
│         │   {user, accessToken,         │         │
│         │    refreshToken, expiresIn}   │         │
└─────────┘                               └─────────┘
     │                                         │
     │ Armazena tokens no                      │ Cria RefreshToken
     │ localStorage/sessionStorage             │ no banco
     │                                         │
     ▼                                         ▼
┌─────────────────────────────────────────────────────┐
│           Requisições Subsequentes                   │
│  Header: Authorization: Bearer <accessToken>         │
└─────────────────────────────────────────────────────┘
```

### Tokens

| Token | Duração | Storage | Uso |
|-------|---------|---------|-----|
| Access Token | 1 hora | localStorage/sessionStorage | Autenticação de requisições |
| Refresh Token | 7 dias | localStorage/sessionStorage + DB | Renovar access token |

### Middleware

```typescript
// auth.middleware.ts
authenticate    // Requer token válido
authorize       // Verifica roles específicas
optionalAuth    // Token opcional
```

### Usuário Admin Padrão

```
Email: sophia@livria.com.br
Senha: Livria@2024!
Role: ADMIN
```

---

## Sistema de IA e TTS

### Arquitetura Multi-Provider

O sistema suporta múltiplos provedores de IA através de uma arquitetura de factory:

```typescript
// Provedores configurados
TextProviderType: 'gemini' | 'openai' | 'anthropic'
ImageProviderType: 'gemini' | 'openai' | 'stability'
TTSProviderType: 'gemini' | 'elevenlabs' | 'azure'
```

### Gemini TTS (Ativo)

- **Modelo:** gemini-2.5-flash-preview-tts
- **30 vozes disponíveis** com variação de gênero e personalidade
- **Rate Limit:** 15 req/min (configurável)
- **Formato de saída:** WAV/MP3

### Vozes Disponíveis

| Categoria | Vozes |
|-----------|-------|
| Masculinas | Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr |
| Femininas | Kore, Aoede, Leda, Electra, Calliope, Clio |
| Neutras | Vários tons e estilos |

---

## Filas e Processamento Assíncrono

### Redis + BullMQ

```
┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Requisição de  │────▶│  Narration Queue │────▶│ Narration      │
│ Narração       │     │  (BullMQ)        │     │ Processor      │
└────────────────┘     └──────────────────┘     └────────────────┘
                                                       │
                                                       ▼
┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Upload Drive   │◀────│  Audio Queue     │◀────│ Audio          │
│ (opcional)     │     │  (BullMQ)        │     │ Processor      │
└────────────────┘     └──────────────────┘     └────────────────┘
```

### Configuração Redis

```
Host: localhost
Port: 6379
```

---

## WebSocket e Tempo Real

### Eventos WebSocket

```typescript
// Cliente → Servidor
'join-chapter'     // Entrar na sala do capítulo
'leave-chapter'    // Sair da sala

// Servidor → Cliente
'narration-progress'  // Progresso da narração (%)
'narration-complete'  // Narração finalizada
'narration-error'     // Erro na narração
```

---

## Variáveis de Ambiente

### Backend (.env)

```env
# Servidor
PORT=3000

# Banco de Dados (Supabase)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Google Drive (opcional)
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_SERVICE_ACCOUNT_KEY=path-to-key.json
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  auth: {
    tokenExpirationMinutes: 60,
    refreshTokenEnabled: true,
    rememberMeDays: 30
  },
  features: {
    socialNetwork: false,
    emailVerification: true,
    twoFactorAuth: false
  }
};
```

---

## Endpoints da API

### Autenticação (/api/auth)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /signup | Criar conta | ❌ |
| POST | /login | Fazer login | ❌ |
| POST | /logout | Fazer logout | ✅ |
| POST | /refresh | Renovar token | ❌ |
| POST | /forgot-password | Solicitar reset | ❌ |
| POST | /reset-password | Resetar senha | ❌ |
| POST | /verify-email | Verificar email | ❌ |
| GET | /profile | Obter perfil | ✅ |
| PATCH | /profile | Atualizar perfil | ✅ |
| POST | /change-password | Alterar senha | ✅ |

### Livros (/api/books)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar livros | ❌ |
| GET | /:id | Obter livro | ❌ |
| POST | / | Criar livro | ✅ |
| PUT | /:id | Atualizar livro | ✅ |
| DELETE | /:id | Deletar livro | ✅ |

### Capítulos (/api/books/:bookId/chapters)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar capítulos | ❌ |
| GET | /:id | Obter capítulo | ❌ |
| POST | / | Criar capítulo | ✅ |
| PUT | /:id | Atualizar capítulo | ✅ |
| DELETE | /:id | Deletar capítulo | ✅ |

### Personagens (/api/books/:bookId/characters)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar personagens | ❌ |
| GET | /:id | Obter personagem | ❌ |
| POST | / | Criar personagem | ✅ |
| PUT | /:id | Atualizar personagem | ✅ |
| DELETE | /:id | Deletar personagem | ✅ |

### Vozes (/api/voices)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar vozes Gemini | ❌ |
| POST | /preview | Preview de voz | ❌ |

### Custom Voices (/api/custom-voices)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar vozes custom | ❌ |
| POST | / | Criar voz | ✅ |
| PUT | /:id | Atualizar voz | ✅ |
| DELETE | /:id | Deletar voz | ✅ |

### Falas (/api/chapters/:chapterId/speeches)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | / | Listar falas | ❌ |
| POST | / | Criar fala | ✅ |
| PUT | /:id | Atualizar fala | ✅ |
| DELETE | /:id | Deletar fala | ✅ |
| POST | /:id/generate-audio | Gerar áudio | ✅ |

### Narração (/api/narration)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | /chapters/:id/generate | Gerar narração | ✅ |
| GET | /chapters/:id/status | Status da narração | ❌ |

---

## Módulos Futuros Planejados

### 1. Rede Social (socialNetwork: false)

- Feed de publicações
- Seguir escritores
- Curtir e comentar livros
- Compartilhar capítulos
- Perfis públicos de escritores

### 2. OAuth (Estrutura Pronta)

- Login com Google
- Login com GitHub
- Campos `provider` e `providerId` já no banco

### 3. Email Service

- Envio de email de verificação
- Envio de email de reset de senha
- Notificações por email

### 4. Two-Factor Auth (twoFactorAuth: false)

- Autenticação em dois fatores
- Códigos por app ou SMS

---

## Problemas Conhecidos

### 1. Navegação pós-login (Frontend)
**Status:** Em investigação  
**Descrição:** Após login bem sucedido com resposta 200, a navegação para `/writer` não está funcionando corretamente.  
**Logs de debug adicionados:** auth.service.ts e login.component.ts

### 2. Envio de Email
**Status:** Não implementado  
**Descrição:** Estrutura pronta mas sem serviço de email configurado (Nodemailer/SendGrid/etc.)

### 3. Upload de Avatar
**Status:** Endpoint pronto, sem implementação de storage  
**Descrição:** Precisa integrar com serviço de storage (S3, Cloudinary, etc.)

---

## Próximos Passos Sugeridos

### Alta Prioridade

1. **Corrigir navegação pós-login**
   - Verificar logs do console do browser
   - Debugar fluxo de autenticação
   - Verificar se tokens estão sendo salvos corretamente

2. **Testar fluxo completo de autenticação**
   - Login/Logout
   - Refresh token
   - Proteção de rotas

### Média Prioridade

3. **Implementar serviço de email**
   - Configurar Nodemailer ou SendGrid
   - Email de verificação
   - Email de reset de senha

4. **Configurar storage para arquivos**
   - Avatares de usuários
   - Capas de livros
   - Áudios gerados

5. **Adicionar validação de owner**
   - Apenas dono do livro pode editar
   - Middleware de autorização por recurso

### Baixa Prioridade

6. **OAuth com Google/GitHub**
   - Fluxo de OAuth2
   - Merge de contas

7. **Módulo de Rede Social**
   - Design do banco de dados
   - APIs de feed
   - Componentes de UI

8. **Testes automatizados**
   - Testes unitários backend
   - Testes E2E frontend

---

## Comandos Úteis

### Backend

```bash
# Desenvolvimento
cd backend
npm run dev

# Build
npm run build
npm start

# Prisma
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npx prisma studio
```

### Frontend

```bash
# Desenvolvimento
cd frontend
ng serve --open

# Build
ng build

# Testes
ng test
```

### Redis

```bash
# Windows (PowerShell)
.\redis-manage.ps1 start
.\redis-manage.ps1 stop
.\redis-manage.ps1 status

# Linux/Mac
./redis-manage.sh start
./redis-manage.sh stop
./redis-manage.sh status
```

---

## Contato e Suporte

**Projeto:** Sistema Livria - Narração de Livros  
**Versão:** 1.0.0  
**Data:** 30/12/2025

---

*Este documento foi gerado para servir como contexto para IAs que irão trabalhar no desenvolvimento contínuo do sistema.*
