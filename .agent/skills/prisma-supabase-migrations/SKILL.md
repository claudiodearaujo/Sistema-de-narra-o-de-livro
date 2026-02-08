---
description: Prisma 7 + Supabase migration workflow with pooler and direct URL handling
---

# Prisma 7 + Supabase Migrations

Este projeto usa **Prisma 7.2.0** com **Supabase PostgreSQL**. O Supabase usa PgBouncer (pooler) na porta 6543, mas migrations requerem conexão direta na porta 5432.

## Configuração Crítica

### Variáveis de Ambiente (.env)
```bash
# Pool connection (porta 6543) - para runtime
DATABASE_URL="postgresql://...@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (porta 5432) - para migrations
DIRECT_URL=postgresql://...@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### prisma.config.ts
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),  // Usado para migrations
  },
});
```

## ⚠️ Problemas Conhecidos com `prisma db push`

O comando `prisma db push` frequentemente **trava** neste projeto devido a:
- Latência com conexão Supabase
- Timeout do PgBouncer
- Problemas de rede/SSL

### ✅ Solução: Script de Migration Direto

Quando `prisma db push` travar, usar script de migration via `pg` diretamente:

```typescript
// prisma/apply-migration-<feature>.ts
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function applyMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS ...`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

applyMigration().catch(console.error);
```

Executar: `npx ts-node prisma/apply-migration-<feature>.ts`

## Workflow Correto de Migrations

1. **Modificar schema.prisma** - Adicionar novos models
2. **Regenerar Prisma Client** - SEMPRE executar antes de qualquer código que use os novos models:
   ```bash
   npx prisma generate
   ```
3. **Aplicar migration** - Tentar primeiro `prisma db push`:
   ```bash
   npx prisma db push --accept-data-loss
   ```
4. **Se travar (>30s)** - Cancelar (Ctrl+C) e criar script direto
5. **Executar seed** - Após migration bem-sucedida:
   ```bash
   npm run seed
   # ou script específico:
   npx ts-node prisma/seed-<feature>.ts
   ```

## ⚠️ Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Unable to compile TypeScript` (2322, 2339) | Prisma Client desatualizado | `npx prisma generate` |
| Command travando | Problema de conexão pooler | Usar script direto com DIRECT_URL |
| `relation does not exist` | Tabela não foi criada | Verificar se migration foi aplicada |

## Checklist Antes de Migrations

- [ ] DIRECT_URL configurada no .env (porta 5432, não 6543)
- [ ] prisma.config.ts usando `directUrl: env("DIRECT_URL")`
- [ ] Após modificar schema.prisma, SEMPRE rodar `npx prisma generate`
- [ ] Ter script alternativo pronto para caso `db push` trave
