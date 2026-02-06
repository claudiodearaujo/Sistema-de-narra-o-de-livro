# 📖 Redis Integration - Exemplos de Uso

## Exemplo Completo: Gerar Narração de um Capítulo

### 1. Criar um Livro
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Harry Potter e a Pedra Filosofal",
    "author": "J.K. Rowling",
    "description": "A história do jovem bruxo Harry Potter"
  }'

# Response:
# {
#   "id": "book-123",
#   "title": "Harry Potter e a Pedra Filosofal",
#   ...
# }
```

### 2. Criar um Capítulo
```bash
curl -X POST http://localhost:3000/api/books/book-123/chapters \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Capítulo 1: A Herança",
    "content": "Sr. e Sra. Dursley, que moravam no número 4..."
  }'

# Response:
# {
#   "id": "chapter-456",
#   "title": "Capítulo 1: A Herança",
#   ...
# }
```

### 3. Criar Personagens
```bash
curl -X POST http://localhost:3000/api/books/book-123/characters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Harry Potter",
    "description": "O protagonista",
    "voiceId": "pt-BR-Standard-A"
  }'

# Response:
# {
#   "id": "char-789",
#   "name": "Harry Potter",
#   "voiceId": "pt-BR-Standard-A"
# }
```

### 4. Criar Falas (Speeches)
```bash
curl -X POST http://localhost:3000/api/chapters/chapter-456/speeches \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "char-789",
    "text": "Meu nome é Harry Potter",
    "orderIndex": 1
  }'

# Criar mais falas...
```

### 5. **Iniciar Narração (FILA REDIS)**
```bash
curl -X POST http://localhost:3000/api/chapters/chapter-456/narration/start \
  -H "Content-Type: application/json"

# Response:
# {
#   "message": "Narration started",
#   "jobId": "1"
# }
```

**O que acontece nos bastidores:**
- ✅ Job criado na fila Redis `narration`
- ✅ Worker inicia processamento
- ✅ Para cada fala:
  - Gera áudio via Gemini TTS
  - Salva a URL do áudio
  - Emite evento WebSocket
- ✅ Narração concluída!

### 6. Verificar Status da Narração
```bash
curl http://localhost:3000/api/chapters/chapter-456/narration/status

# Response:
# {
#   "status": "active",
#   "jobId": "1",
#   "progress": 45
# }
```

Ou após conclusão:
```json
{
  "status": "completed",
  "jobId": "1",
  "progress": 100
}
```

### 7. Processar Áudio (FILA REDIS)
```bash
curl -X POST http://localhost:3000/api/chapters/chapter-456/audio/process \
  -H "Content-Type: application/json"

# Response:
# {
#   "message": "Audio processing started",
#   "jobId": "2"
# }
```

**O que acontece:**
- ✅ Job criado na fila Redis `audio`
- ✅ Worker:
  - Busca arquivos de áudio das falas
  - Concatena com FFmpeg (25%)
  - Normaliza volume (50%)
  - Faz upload para Google Drive (75%)
  - Retorna URL final (100%)

### 8. Verificar Status do Processamento de Áudio
```bash
curl http://localhost:3000/api/chapters/chapter-456/audio/status

# Response:
# {
#   "status": "active",
#   "jobId": "2",
#   "result": {
#     "chapterId": "chapter-456",
#     "finalUrl": "https://drive.google.com/...",
#     "status": "completed"
#   }
# }
```

---

## 🔌 Integração com Frontend (WebSocket)

### JavaScript/Angular
```typescript
import { Socket, io } from 'socket.io-client';

export class NarrationService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  startNarration(chapterId: string) {
    // Entrar na sala do capítulo
    this.socket.emit('join', { chapterId });

    // Ouvir eventos de narração
    this.socket.on('narration:started', (data) => {
      console.log('✅ Narração iniciada:', data);
      // Mostrar spinner de carregamento
    });

    this.socket.on('narration:progress', (data) => {
      console.log('📊 Progresso:', data.current, '/', data.total);
      // Atualizar barra de progresso
      this.progress = (data.current / data.total) * 100;
    });

    this.socket.on('narration:speech-completed', (data) => {
      console.log('✅ Fala concluída:', data.speechId);
      console.log('🔊 Áudio:', data.audioUrl);
      // Reproduzir áudio?
    });

    this.socket.on('narration:completed', (data) => {
      console.log('🎉 Narração concluída!');
      // Mostrar botão de download
      // Atualizar UI
    });

    this.socket.on('narration:failed', (data) => {
      console.error('❌ Erro:', data.error);
      // Mostrar mensagem de erro
    });
  }
}
```

---

## 📊 Monitorar Fila Redis

### Via redis-cli
```bash
redis-cli

# Ver todas as chaves
> KEYS *

# Ver jobs na fila narration
> LRANGE bull:narration:waiting 0 -1

# Ver jobs ativos
> ZRANGE bull:narration:active 0 -1

# Ver jobs completados
> ZRANGE bull:narration:completed 0 -1

# Ver jobs que falharam
> ZRANGE bull:narration:failed 0 -1

# Contar jobs
> LLEN bull:narration:waiting
```

### Via Dashboard (opcional)
```bash
# Instalar Bull Board
npm install bull-board express

# Adicionar rota no Express
app.use('/admin/queues', arena(options));

# Acessar em http://localhost:3000/admin/queues
```

---

## ⚡ Performance

### Antes (Sem Redis)
- ❌ Processamento síncrono
- ❌ Requisição aguarda conclusão
- ❌ Timeout em 30 segundos
- ❌ Sem retry automático

### Depois (Com Redis)
- ✅ Processamento assíncrono
- ✅ Requisição retorna imediatamente
- ✅ Sem timeout (processamento em background)
- ✅ Retry automático em caso de falha
- ✅ Pode processar múltiplas narações em paralelo

---

## 🐛 Debugging

### Logs do Backend
```bash
# Procurar por estes padrões nos logs:
✅ Narration Queue initialized          # Fila criada
✅ Audio queue initialized              # Fila de áudio criada
✅ Worker connected to Redis            # Worker conectado
📦 Processing job 1: {...}              # Job sendo processado
✅ Job completed: {...}                 # Job finalizado
❌ Job failed: {...}                    # Job falhou
```

### Verificar Conexão Redis
```bash
node test-redis-connection.js
```

### Testar Filas
```bash
node test-queues.js
```

---

## 🎯 Casos de Uso

### Caso 1: Narrar um capítulo com 10 falas
- Sem Redis: 30-60 segundos (timeout frequente)
- Com Redis: 2-3 segundos (resposta imediata + processamento em background)

### Caso 2: Múltiplos usuários narrando simultaneamente
- Sem Redis: Servidor congestionado, alguns requests falham
- Com Redis: Filas processadas em paralelo, todos os requests succedem

### Caso 3: Fala com erro ao gerar áudio
- Sem Redis: Falha da requisição, perda de progresso
- Com Redis: Job entra na fila de retry, tenta novamente automaticamente

---

## 📝 Dicas de Produção

1. **Persistência Redis**: Configure `dump.rdb` para salvar dados
2. **Monitoramento**: Use Redis Insights ou New Relic
3. **Alertas**: Configure notificações para jobs que falham
4. **Backup**: Faça backup regular das filas
5. **Escalamento**: Adicione múltiplos workers em máquinas diferentes

---

**Tudo pronto! 🎉 Redis está integrado e funcionando!**
