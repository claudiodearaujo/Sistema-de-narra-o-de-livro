// ============================================================
// Prisma Config - Backend (Prisma 7)
// ============================================================
// No Prisma 7, directUrl foi removido. O campo "url" aqui é usado
// exclusivamente pelo Prisma CLI (migrate, generate, introspect).
// Por isso, usamos DIRECT_URL (conexão direta, porta 5432).
//
// O PrismaClient em runtime usa DATABASE_URL (pooler PgBouncer:6543)
// via adapter pg — configurado em src/lib/prisma.ts.
//
// - DIRECT_URL    → conexão direta (Postgres:5432)  → Prisma CLI
// - DATABASE_URL  → conexão pooled (PgBouncer:6543) → PrismaClient runtime
// ============================================================
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
