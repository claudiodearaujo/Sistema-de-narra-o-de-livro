import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function applyMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ===== ENUMS =====

        // AuditAction
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AuditAction" AS ENUM (
          'AUTH_LOGIN','AUTH_LOGIN_FAILED','AUTH_LOGOUT','AUTH_LOGOUT_ALL','AUTH_SIGNUP',
          'AUTH_TOKEN_REFRESH','AUTH_PASSWORD_CHANGE','AUTH_PASSWORD_RESET_REQUEST',
          'AUTH_PASSWORD_RESET_COMPLETE','AUTH_EMAIL_VERIFY',
          'BOOK_CREATE','BOOK_UPDATE','BOOK_DELETE','BOOK_VIEW',
          'CHAPTER_CREATE','CHAPTER_UPDATE','CHAPTER_DELETE','CHAPTER_REORDER',
          'CHARACTER_CREATE','CHARACTER_UPDATE','CHARACTER_DELETE',
          'SPEECH_CREATE','SPEECH_UPDATE','SPEECH_DELETE',
          'NARRATION_START','NARRATION_COMPLETE','NARRATION_FAIL','AUDIO_GENERATE','AUDIO_DELETE',
          'POST_CREATE','POST_UPDATE','POST_DELETE',
          'COMMENT_CREATE','COMMENT_DELETE',
          'LIKE_TOGGLE','FOLLOW_TOGGLE',
          'MESSAGE_SEND','MESSAGE_DELETE',
          'PROFILE_UPDATE','AVATAR_UPLOAD',
          'GROUP_CREATE','GROUP_UPDATE','GROUP_DELETE','GROUP_JOIN','GROUP_LEAVE',
          'GROUP_MEMBER_ROLE_CHANGE','GROUP_MEMBER_REMOVE',
          'CAMPAIGN_CREATE','CAMPAIGN_UPDATE','CAMPAIGN_DELETE','CAMPAIGN_JOIN',
          'STORY_CREATE','STORY_DELETE',
          'SUBSCRIPTION_CREATE','SUBSCRIPTION_CANCEL','SUBSCRIPTION_UPGRADE','SUBSCRIPTION_DOWNGRADE',
          'LIVRA_PURCHASE','LIVRA_SPEND','LIVRA_EARN',
          'AI_TEXT_GENERATE','AI_IMAGE_GENERATE','AI_TTS_GENERATE',
          'ADMIN_USER_BAN','ADMIN_USER_UNBAN','ADMIN_USER_ROLE_CHANGE',
          'ADMIN_CONTENT_REMOVE','ADMIN_CONFIG_CHANGE',
          'RATE_LIMIT_EXCEEDED','PERMISSION_DENIED','PLAN_LIMIT_REACHED'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✅ Enum AuditAction criado (ou já existia)');

        // AuditCategory
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AuditCategory" AS ENUM (
          'AUTH','BOOK','CHAPTER','CHARACTER','SPEECH','NARRATION',
          'SOCIAL','MESSAGE','PROFILE','GROUP','CAMPAIGN','STORY',
          'FINANCIAL','AI','ADMIN','SYSTEM'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✅ Enum AuditCategory criado (ou já existia)');

        // AuditSeverity
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AuditSeverity" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✅ Enum AuditSeverity criado (ou já existia)');

        // ===== TABELA audit_logs =====
        await client.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "userId" TEXT,
        "userEmail" TEXT,
        "userRole" "UserRole",
        "action" "AuditAction" NOT NULL,
        "category" "AuditCategory" NOT NULL,
        "severity" "AuditSeverity" NOT NULL DEFAULT 'MEDIUM',
        "resource" TEXT,
        "resourceId" TEXT,
        "method" TEXT,
        "endpoint" TEXT,
        "statusCode" INTEGER,
        "metadata" JSONB,
        "description" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "sessionId" TEXT,
        "success" BOOLEAN NOT NULL DEFAULT true,
        "errorMessage" TEXT,
        "duration" INTEGER,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log('✅ Tabela audit_logs criada (ou já existia)');

        // Indexes para audit_logs
        const indexes = [
            { name: 'audit_logs_userId_idx', cols: '"userId"' },
            { name: 'audit_logs_action_idx', cols: '"action"' },
            { name: 'audit_logs_category_idx', cols: '"category"' },
            { name: 'audit_logs_severity_idx', cols: '"severity"' },
            { name: 'audit_logs_resource_resourceId_idx', cols: '"resource", "resourceId"' },
            { name: 'audit_logs_created_at_idx', cols: '"created_at"' },
            { name: 'audit_logs_success_idx', cols: '"success"' },
            { name: 'audit_logs_ipAddress_idx', cols: '"ipAddress"' },
            { name: 'audit_logs_userId_created_at_idx', cols: '"userId", "created_at"' },
            { name: 'audit_logs_category_created_at_idx', cols: '"category", "created_at"' },
            { name: 'audit_logs_action_created_at_idx', cols: '"action", "created_at"' },
        ];

        for (const idx of indexes) {
            await client.query(`CREATE INDEX IF NOT EXISTS "${idx.name}" ON "audit_logs"(${idx.cols});`);
        }
        console.log('✅ Indexes de audit_logs criados');

        // FK audit_logs -> users
        await client.query(`
      DO $$ BEGIN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✅ FK audit_logs -> users criada (ou já existia)');

        // ===== TABELA oauth_clients =====
        await client.query(`
      CREATE TABLE IF NOT EXISTS "oauth_clients" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "client_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "allowed_redirect_uris" TEXT[] NOT NULL,
        "allowed_scopes" TEXT[] NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
      );
    `);
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "oauth_clients_client_id_key" ON "oauth_clients"("client_id");`);
        console.log('✅ Tabela oauth_clients criada (ou já existia)');

        // ===== TABELA oauth_authorization_codes =====
        await client.query(`
      CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "code" TEXT NOT NULL,
        "client_id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "redirect_uri" TEXT NOT NULL,
        "scope" TEXT NOT NULL,
        "code_challenge" TEXT NOT NULL,
        "code_challenge_method" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "used_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "oauth_authorization_codes_pkey" PRIMARY KEY ("id")
      );
    `);
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "oauth_authorization_codes_code_key" ON "oauth_authorization_codes"("code");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_code_idx" ON "oauth_authorization_codes"("code");`);
        await client.query(`CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_expires_at_idx" ON "oauth_authorization_codes"("expires_at");`);
        console.log('✅ Tabela oauth_authorization_codes criada (ou já existia)');

        // FK oauth_authorization_codes -> oauth_clients
        await client.query(`
      DO $$ BEGIN
        ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_client_id_fkey"
          FOREIGN KEY ("client_id") REFERENCES "oauth_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
        console.log('✅ FK oauth_authorization_codes -> oauth_clients criada (ou já existia)');

        await client.query('COMMIT');
        console.log('\n🎉 Todas as tabelas faltantes foram criadas com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

applyMigration().catch((err) => {
    console.error(err);
    process.exit(1);
});
