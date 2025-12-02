# Sistema de Narração de Livro

Sistema completo para geração de audiolivros com narração por IA, utilizando Google Gemini TTS.

## 🎯 Funcionalidades

- **Gestão de Livros e Capítulos**: Organize seus livros e capítulos
- **Personagens com Vozes**: Atribua vozes únicas do Gemini TTS para cada personagem
- **Editor SSML**: Controle fino sobre prosódia, pausas e entonação
- **Geração Assíncrona**: Processamento em background com feedback em tempo real via WebSockets
- **Pós-processamento de Áudio**: Concatenação, normalização e upload para Google Drive
- **Interface Moderna**: Angular 20 com PrimeNG e Tailwind CSS v4

## 🏗️ Arquitetura

### Backend
- **Node.js + TypeScript + Express**
- **PostgreSQL** (via Prisma ORM)
- **Redis** (BullMQ para filas)
- **Socket.IO** (WebSockets para progresso em tempo real)
- **Google Gemini TTS** (geração de áudio)
- **FFmpeg** (processamento de áudio)
- **Google Drive API** (armazenamento)

### Frontend
- **Angular 20**
- **PrimeNG 20+**
- **Tailwind CSS v4**
- **Socket.IO Client**

## 📋 Pré-requisitos

### Obrigatórios
- **Node.js** 18+ e npm
- **PostgreSQL** 14+
- **Redis** 6+
- **FFmpeg** (para processamento de áudio)

### Opcionais
- **Google Cloud Service Account** (para upload no Drive)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <repo-url>
cd Sistema-de-narra-o-de-livro
```

### 2. Backend

```bash
cd backend
npm install
```

#### Configuração (.env)
Crie um arquivo `.env` na pasta `backend`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/narration_db"

# Gemini TTS
GEMINI_API_KEY="your-gemini-api-key"
TTS_DEFAULT_PROVIDER="gemini"

# Redis (BullMQ)
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Google Drive (opcional)
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
DRIVE_ROOT_FOLDER_ID="your-drive-folder-id"

# Server
PORT=3000
```

#### Prisma Setup
```bash
npx prisma generate
npx prisma db push
```

#### Iniciar Backend
```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
```

#### Configuração
O frontend está configurado para conectar ao backend em `http://localhost:3000`. Ajuste em `environment.ts` se necessário.

#### Iniciar Frontend
```bash
npm start
# ou
ng serve -o
```

Acesse: `http://localhost:4200`

## 🔧 Configuração de Serviços Externos

### Redis
Instale e inicie o Redis:

**Windows (via Chocolatey):**
```bash
choco install redis-64
redis-server
```

**Linux/Mac:**
```bash
sudo apt-get install redis-server
redis-server
```

### FFmpeg
Instale o FFmpeg e adicione ao PATH do sistema:

**Windows:**
- Download: https://ffmpeg.org/download.html
- Adicione ao PATH

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

Verifique:
```bash
ffmpeg -version
```

### Google Drive API (Opcional)

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/)
2. Ative a **Google Drive API**
3. Crie uma **Service Account**
4. Baixe o arquivo JSON de credenciais
5. Salve como `backend/service-account.json`
6. Configure `GOOGLE_APPLICATION_CREDENTIALS` e `DRIVE_ROOT_FOLDER_ID` no `.env`

> **Nota:** Se não configurar o Google Drive, o sistema usará URLs mockadas para desenvolvimento.

## 📖 Uso

### Fluxo Completo

1. **Criar Livro**: Adicione um novo livro com título, autor e descrição
2. **Adicionar Capítulos**: Crie capítulos para o livro
3. **Criar Personagens**: Defina personagens e atribua vozes do Gemini
4. **Adicionar Falas**: No detalhe do capítulo, adicione falas com texto e SSML
5. **Gerar Narração**: Clique em "Iniciar Narração" para processar todas as falas
6. **Processar Áudio**: Após conclusão, clique em "Processar Áudio Final" para concatenar e normalizar
7. **Download**: Ouça ou baixe o áudio final

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
ng test
```

## 📁 Estrutura do Projeto

```
Sistema-de-narra-o-de-livro/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Controladores REST
│   │   ├── services/          # Lógica de negócio
│   │   ├── routes/            # Rotas da API
│   │   ├── queues/            # BullMQ workers
│   │   ├── websocket/         # Socket.IO server
│   │   ├── tts/               # Abstração TTS
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, models
│   │   │   ├── features/      # Componentes por feature
│   │   │   └── app.component.ts
│   │   └── styles.css         # Tailwind + Design System
│   └── package.json
└── README.md
```

## 🎨 Design System

O projeto utiliza a paleta "5 Elementos":
- **Terra** (Metal): `#2C3E50`
- **Fogo**: `#E74C3C`
- **Água**: `#3498DB`
- **Madeira**: `#27AE60`
- **Metal** (Dourado): `#F39C12`

Configurado em `frontend/src/styles.css` com suporte a dark mode.

## 🐛 Troubleshooting

### Redis Connection Failed
- Verifique se o Redis está rodando: `redis-cli ping` (deve retornar `PONG`)
- Confirme `REDIS_HOST` e `REDIS_PORT` no `.env`

### FFmpeg Not Found
- Verifique instalação: `ffmpeg -version`
- Adicione FFmpeg ao PATH do sistema

### Prisma Client Errors
```bash
cd backend
npx prisma generate
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📝 Licença

Este projeto é proprietário.

## 👥 Contribuindo

Contribuições são bem-vindas! Abra issues ou pull requests.

## 🔗 Links Úteis

- [Gemini API](https://ai.google.dev/)
- [PrimeNG](https://primeng.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [BullMQ](https://docs.bullmq.io/)
