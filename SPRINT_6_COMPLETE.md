# 🚀 Sprint 6 — Operações em Lote (Batch Operations) & Exportação

## ✅ Status: Completo

Este sprint implementou funcionalidades para processamento em massa de conteúdo do capítulo, permitindo que o usuário gere áudio e imagens para todas as falas de uma vez, além de exportar o capítulo como um único arquivo de áudio.

---

## 🛠️ Alterações Backend

### 1. Novo Controller e Rotas
- **`BatchController`** (`backend/src/controllers/batch.controller.ts`)
  - Gerencia requisições de operações em lote.
- **Rotas** (`backend/src/routes/batch.routes.ts`)
  - `POST /api/chapters/:id/batch/generate-audio`: Inicia geração de TTS para todas as falas.
  - `POST /api/chapters/:id/batch/generate-images`: Inicia geração de imagens de cena.
  - `POST /api/chapters/:id/export`: Inicia concatenação de áudio do capítulo.

### 2. Filas de Processamento (BullMQ)
- **`narration.queue.ts`**: Reutilizada para geração de áudio em lote.
- **`media.queue.ts`** (Novo): Fila dedicada para geração de imagens.
- **`audio.queue.ts`**: Reutilizada para exportação/concatenação.

### 3. Workers e Processadores
- **`media.processor.ts`** (Novo): Worker que processa a fila de mídia.
  - Itera sobre as falas do capítulo.
  - Chama `aiService.generateEmotionImage` para cada fala.
  - Atualiza o banco de dados e notifica via WebSocket.

### 4. Serviços
- **`media-batch.service.ts`** (Novo): Serviço para orquestrar jobs de mídia.

---

## 💻 Alterações Frontend

### 1. Novo Hook
- **`useBatchOperations.ts`**: Hook React Query para consumir os novos endpoints de lote.

### 2. Interface de Usuário
- **`TopBar.tsx`**: Adicionado menu dropdown "Ferramentas" (ícone de varinha mágica).
  - **Gerar Áudio (Todas as falas)**: Dispara TTS em lote.
  - **Gerar Imagens (Todas as falas)**: Dispara geração de imagens.
  - **Exportar Áudio (.mp3)**: Gera arquivo unificado do capítulo.

---

## 🧪 Como Testar

1. **Iniciar Servidores**: Certifique-se que Backend, Frontend e Redis estão rodando.
2. **Navegar para o Studio**: Abra um capítulo.
3. **Menu Ferramentas**: Clique no ícone de "Varinha Mágica" na barra superior.
4. **Gerar Imagens**:
   - Clique em "Gerar Imagens (Todas as falas)".
   - Verifique o Toast de confirmação.
   - Observe os logs do backend (`Running Media Worker...`).
   - As imagens devem aparecer nas falas conforme são geradas.
5. **Exportar Áudio**:
   - Garanta que as falas tenham áudio gerado.
   - Clique em "Exportar Áudio (.mp3)".
   - O worker de áudio irá concatenar e disponibilizar o link (via update futuro ou notificação).

---

## ⚠️ Requisitos de Sistema
- **Redis**: Necessário estar rodando para funcionamento das filas.
- **FFmpeg**: Necessário no servidor para concatenação de áudio.

---

## ⏭️ Próximos Passos (Sprint 7)
- Dashboard de Analytics do Autor.
- Painel de Exportação avançado (ePub, PDF).
