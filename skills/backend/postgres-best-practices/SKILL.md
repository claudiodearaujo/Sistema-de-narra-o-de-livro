---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
license: MIT
metadata:
  author: supabase
  version: "1.0.0"
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
rules/query-missing-indexes.md
rules/schema-partial-indexes.md
rules/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## Supabase Connection Pooling & Prisma Migrations

Supabase uses **PgBouncer** (transaction pooling mode) on port 6543.
DDL statements (`CREATE TABLE`, `ALTER TABLE`, `CREATE TYPE`) do NOT work through PgBouncer.

### Two URLs Required

| Variable | Connection Type | Port | Used By |
|----------|----------------|------|---------|
| `DATABASE_URL` | Pooled (PgBouncer) | 6543 | Prisma Client (runtime queries) |
| `DIRECT_URL` | Direct (no pooler) | 5432 | Prisma Migrate (DDL/migrations) |

### Prisma 7+ Configuration

In Prisma 7+, `directUrl` in `schema.prisma` is removed. Use `prisma.config.ts`:

```typescript
// prisma.config.ts
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

export default {
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async development() {
      return { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' };
    },
  },
} satisfies PrismaConfig;
```

### Supabase URL Patterns

```
# Pooled (PgBouncer) — for runtime queries
postgresql://user:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct — for migrations (DDL)
postgresql://user:pass@aws-0-region.supabase.com:5432/postgres
```

**Key indicators:** URL with `pooler.supabase.com` and port `6543` = pooled.
URL without `pooler` and port `5432` = direct.

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
