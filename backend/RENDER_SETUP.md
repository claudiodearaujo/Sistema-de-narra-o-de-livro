# Guia de Deploy no Render.com

## Configuração do Serviço Backend no Render

### 1. Pré-requisitos

Antes de começar, certifique-se de ter:
- Conta no Render.com
- Repositório Git do projeto (GitHub, GitLab ou Bitbucket)
- Chaves de API necessárias (Gemini, Stripe, etc.)

### 2. Criar Banco de Dados PostgreSQL

1. No dashboard do Render, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `livria-db` (ou outro nome de sua preferência)
   - **Database**: `livria`
   - **User**: (será gerado automaticamente)
   - **Region**: Escolha a região mais próxima
   - **PostgreSQL Version**: 16 (recomendado)
   - **Plan**: Free ou Starter (conforme necessidade)
3. Clique em **"Create Database"**
4. Aguarde a criação e copie a **Internal Database URL** (formato: `postgresql://user:pass@host/db`)

### 3. Criar Serviço Redis (Opcional, mas recomendado)

#### Opção A: Redis do Render (Recomendado se disponível)
1. No dashboard, clique em **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `livria-redis`
   - **Region**: Mesma do PostgreSQL
   - **Plan**: Free (se disponível) ou Starter
3. Clique em **"Create Redis"**
4. Copie a **Internal Redis URL**

#### Opção B: Redis.io / Upstash (Conta Free disponível)
1. Acesse [Redis.io](https://redis.io/) ou [Upstash](https://upstash.com/)
2. Crie uma conta gratuita
3. Crie um novo banco de dados Redis
4. Copie a **Connection URL** (formato: `redis://default:password@host:port`)

### 4. Criar Web Service (Backend)

1. No dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório Git
3. Configure:

#### Build & Deploy Settings:
```
Name: livria-backend
Region: [mesma do banco de dados]
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

#### Environment:
```
Node Version: 18 (ou superior)
```

### 5. Configurar Variáveis de Ambiente

Na seção **"Environment"** do seu Web Service, adicione as seguintes variáveis:

#### Core Application
```
NODE_ENV=production
PORT=10000
```

#### Database
```
DATABASE_URL=[Cole a Internal Database URL do PostgreSQL aqui]
```
> Use a **Internal Database URL**, não a External

#### Redis

**IMPORTANTE**: O código agora suporta `REDIS_URL` (recomendado) para serviços como Redis.io, Upstash, etc.

**Opção 1 - Usando REDIS_URL (Recomendado):**
```
REDIS_ENABLED=true
REDIS_URL=[Cole a Redis URL completa aqui]
```
Exemplos de formato:
- Redis.io/Upstash: `redis://default:sua_senha@host.redis.io:port`
- Com TLS: `rediss://default:sua_senha@host.redis.io:port`
- Render Redis: Use a Internal Redis URL fornecida

**Opção 2 - Configuração Individual (Fallback):**
```
REDIS_ENABLED=true
REDIS_HOST=[host do Redis]
REDIS_PORT=6379
REDIS_PASSWORD=[senha do Redis]
```

> **Nota**: Se você está usando Redis.io ou Upstash, use a **Opção 1** com a URL completa que eles fornecem.

#### JWT Authentication
```
JWT_SECRET=[Gere uma string aleatória segura]
JWT_REFRESH_SECRET=[Gere outra string aleatória segura]
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

> Para gerar secrets seguros, execute localmente:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### CORS Configuration
```
ALLOWED_ORIGINS=https://seu-frontend.com,https://www.seu-frontend.com
```

#### AI Providers (Gemini - Obrigatório)
```
AI_TEXT_PROVIDER=gemini
AI_IMAGE_PROVIDER=gemini
AI_TTS_PROVIDER=gemini
GEMINI_API_KEY=[Sua chave da API Gemini]
GEMINI_TEXT_MODEL=gemini-2.0-flash
GEMINI_IMAGE_MODEL=imagen-3.0-generate-001
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
GEMINI_RATE_LIMIT_RPM=15
GEMINI_RATE_LIMIT_RETRY_DELAY=5000
GEMINI_RATE_LIMIT_MAX_RETRIES=5
```

#### Stripe (Pagamentos)
```
STRIPE_SECRET_KEY=[Sua chave secreta do Stripe]
STRIPE_WEBHOOK_SECRET=[Webhook secret do Stripe]
STRIPE_PREMIUM_MONTHLY_PRICE_ID=[ID do preço mensal premium]
STRIPE_PREMIUM_YEARLY_PRICE_ID=[ID do preço anual premium]
STRIPE_PRO_MONTHLY_PRICE_ID=[ID do preço mensal pro]
STRIPE_PRO_YEARLY_PRICE_ID=[ID do preço anual pro]
```

#### Google Cloud (Opcional - para storage)
```
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/google-credentials.json
DRIVE_ROOT_FOLDER_ID=[ID da pasta raiz no Google Drive]
```

#### Feature Flags
```
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_STRIPE_PAYMENTS=true
ENABLE_AI_FEATURES=true
```

### 6. Configurar Google Cloud Credentials (Se necessário)

Se você usa Google Cloud para storage:

1. No Render, vá em **"Environment"** → **"Secret Files"**
2. Clique em **"Add Secret File"**
3. Configure:
   - **Filename**: `google-credentials.json`
   - **Contents**: Cole o conteúdo do seu arquivo JSON de credenciais do Google Cloud
4. Salve

### 7. Executar Migrações do Prisma

Após o primeiro deploy bem-sucedido, você precisa executar as migrações:

#### Opção 1: Via Shell do Render
1. No dashboard do seu serviço, vá em **"Shell"**
2. Execute:
```bash
npx prisma migrate deploy
```

#### Opção 2: Adicionar ao Build Command
Altere o Build Command para:
```
npm install && npm run build && npx prisma migrate deploy
```

### 8. (Opcional) Popular o Banco de Dados

Se quiser executar o seed:
```bash
npm run seed
```

### 9. Verificar Deploy

1. Aguarde o deploy completar
2. Verifique os logs em **"Logs"** para confirmar que não há erros
3. Teste a URL fornecida pelo Render (algo como `https://livria-backend.onrender.com`)

### 10. Configurar Webhooks do Stripe

1. No Dashboard do Stripe, vá em **"Developers"** → **"Webhooks"**
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://seu-backend.onrender.com/api/webhooks/stripe`
   - **Events to send**: Selecione os eventos necessários para subscriptions
4. Copie o **Signing secret** e atualize `STRIPE_WEBHOOK_SECRET` no Render

### 11. Healthcheck (Recomendado)

Configure um healthcheck no Render:
1. Vá em **"Settings"** → **"Health Check Path"**
2. Configure: `/health` ou `/` (dependendo da sua rota de health check)

## Troubleshooting

### Erro: "Module '@prisma/client' has no exported member..."
- **Causa**: Prisma Client não foi gerado
- **Solução**: Já corrigido com `postinstall` script. Se persistir, adicione ao Build Command:
```
npm install && npx prisma generate && npm run build
```

### Erro: Conexão com banco de dados falhou
- Verifique se está usando a **Internal Database URL**
- Certifique-se de que o banco e o backend estão na mesma região

### Erro: Build timeout
- Aumente o timeout nas configurações do serviço
- Ou mova dependências desnecessárias para `devDependencies`

### Erro: Redis connection failed
- Verifique se `REDIS_ENABLED=true` e as credenciais estão corretas
- Ou desabilite Redis temporariamente com `REDIS_ENABLED=false`

### Logs não aparecem
- Use `console.log` em vez de apenas `log`
- Verifique a aba **"Logs"** no dashboard

## Comandos Úteis

### Acessar Shell do Render
```bash
# No dashboard, clique em "Shell"
```

### Ver logs em tempo real
```bash
# No dashboard, vá em "Logs" e ative "Auto-scroll"
```

### Executar migrações manualmente
```bash
npx prisma migrate deploy
```

### Resetar banco de dados (CUIDADO!)
```bash
npx prisma migrate reset --force
```

## Checklist Final

- [ ] PostgreSQL criado e conectado
- [ ] Redis criado e conectado (opcional)
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] Migrações do Prisma aplicadas
- [ ] API respondendo corretamente
- [ ] Webhooks do Stripe configurados (se aplicável)
- [ ] CORS configurado com origens corretas
- [ ] Logs sendo gerados corretamente

## Monitoramento

Após o deploy:
1. Configure alertas no Render para downtime
2. Monitore uso de recursos (CPU, Memória, Bandwidth)
3. Verifique logs regularmente
4. Configure backup automático do PostgreSQL

## Recursos Adicionais

- [Documentação Render - Node.js](https://render.com/docs/deploy-node-express-app)
- [Render - PostgreSQL](https://render.com/docs/databases)
- [Prisma - Deploy](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)
