/**
 * Script to apply OAuth migration directly to Supabase
 * ============================================================
 * INSTRUÇÃO: Este script usa DIRECT_URL (conexão direta, porta 5432)
 * e NÃO a DATABASE_URL (pooled via PgBouncer, porta 6543).
 *
 * Isso é OBRIGATÓRIO porque:
 * - PgBouncer (porta 6543) não suporta advisory locks nem DDL transacional
 * - Migrations e scripts DDL sempre precisam da conexão direta
 *
 * Pré-requisitos:
 *   1. Ter DIRECT_URL definida no .env (porta 5432, sem ?pgbouncer=true)
 *   2. npm install pg dotenv (dependências necessárias)
 *
 * Execução:
 *   npx ts-node prisma/apply-oauth-migration.ts
 *
 * NOTA: O prisma.config.ts do backend já foi corrigido para usar
 * directUrl: env("DIRECT_URL") nas migrations do Prisma Migrate.
 * Este script é uma alternativa manual que aplica SQL diretamente.
 * ============================================================
 */
import 'dotenv/config';
import { Pool } from 'pg';

const DIRECT_URL = process.env.DIRECT_URL;

if (!DIRECT_URL) {
  console.error('❌ DIRECT_URL not found in environment');
  process.exit(1);
}

const pool = new Pool({ connectionString: DIRECT_URL });

async function applyMigration() {
  console.log('🔄 Applying OAuth migration...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create oauth_clients table
    console.log('📝 Creating oauth_clients table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        client_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        allowed_redirect_uris TEXT[] NOT NULL,
        allowed_scopes TEXT[] NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create oauth_authorization_codes table
    console.log('📝 Creating oauth_authorization_codes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        code TEXT UNIQUE NOT NULL,
        client_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        scope TEXT NOT NULL,
        code_challenge TEXT NOT NULL,
        code_challenge_method TEXT NOT NULL,
        expires_at TIMESTAMP(3) NOT NULL,
        used_at TIMESTAMP(3),
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS oauth_auth_codes_code_idx ON oauth_authorization_codes(code);
      CREATE INDEX IF NOT EXISTS oauth_auth_codes_expires_idx ON oauth_authorization_codes(expires_at);
    `);
    
    await client.query('COMMIT');
    console.log('✅ OAuth migration applied successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

applyMigration()
  .then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
