# Migration Principles

> Safe migration strategy for zero-downtime changes.

## Safe Migration Strategy

```
For zero-downtime changes:
│
├── Adding column
│   └── Add as nullable → backfill → add NOT NULL
│
├── Removing column
│   └── Stop using → deploy → remove column
│
├── Adding index
│   └── CREATE INDEX CONCURRENTLY (non-blocking)
│
└── Renaming column
    └── Add new → migrate data → deploy → drop old
```

## Migration Philosophy

- Never make breaking changes in one step
- Test migrations on data copy first
- Have rollback plan
- Run in transaction when possible
- **Write idempotent SQL** — use `IF NOT EXISTS`, `DO $$ EXCEPTION` blocks

## Idempotent Migration Patterns (PostgreSQL)

PostgreSQL does NOT support `CREATE TYPE ... IF NOT EXISTS`. Wrap in exception handler:

```sql
-- Enum types
DO $$ BEGIN
    CREATE TYPE "StatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tables, indexes
CREATE TABLE IF NOT EXISTS "my_table" (...);
CREATE INDEX IF NOT EXISTS "my_idx" ON "my_table"("col");

-- Foreign keys / constraints
DO $$ BEGIN
    ALTER TABLE "t" ADD CONSTRAINT "fk_name" FOREIGN KEY ("col") REFERENCES "other"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
```

This prevents `ERROR 42710` when re-running after partial failure or out-of-band changes.

## Recovering Failed Migrations (Prisma)

When `prisma migrate deploy` fails mid-execution, it marks the migration as "failed"
in `_prisma_migrations`. All subsequent deploys are blocked. To recover:

```bash
# Mark as rolled-back (removes failed state)
npx prisma migrate resolve --rolled-back "migration_name"
# Fix SQL to be idempotent, then redeploy
npx prisma migrate deploy
```

## Connection Pooling & Migrations (Supabase/Neon)

Supabase and Neon use PgBouncer by default. DDL statements (CREATE TABLE, ALTER, etc.)
fail through transaction-mode pooling. Always use a **direct connection** for migrations:

```
DATABASE_URL  = pooled connection (port 6543) → Prisma Client runtime
DIRECT_URL    = direct connection (port 5432) → Prisma Migrate DDL
```

In Prisma 7+, configure via `prisma.config.ts` (`migrate.development()` returning `DIRECT_URL`).

## Serverless Databases

### Neon (Serverless PostgreSQL)

| Feature | Benefit |
|---------|---------|
| Scale to zero | Cost savings |
| Instant branching | Dev/preview |
| Full PostgreSQL | Compatibility |
| Autoscaling | Traffic handling |

### Turso (Edge SQLite)

| Feature | Benefit |
|---------|---------|
| Edge locations | Ultra-low latency |
| SQLite compatible | Simple |
| Generous free tier | Cost |
| Global distribution | Performance |
