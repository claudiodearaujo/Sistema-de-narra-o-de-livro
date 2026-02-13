// ============================================================
// Prisma Config - AI Service
// ============================================================
// IMPORTANTE: Para Supabase, o Prisma Migrate PRECISA da DIRECT_URL
// (conexão direta, porta 5432) e NÃO da DATABASE_URL (pooled via
// PgBouncer, porta 6543). O PgBouncer não suporta advisory locks
// nem tabelas temporárias que o Prisma Migrate necessita.
//
// - DATABASE_URL  → conexão pooled (PgBouncer:6543) → para queries runtime
// - DIRECT_URL    → conexão direta (Postgres:5432)  → para migrations
//
// Comando de migração:
//   npx prisma migrate dev --name <nome_da_migracao>
//   npx prisma migrate deploy  (produção)
//
// Certifique-se de que ambas as variáveis estejam definidas no .env
// ============================================================
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env("DATABASE_URL"),
        directUrl: env("DIRECT_URL"),
    },
});
