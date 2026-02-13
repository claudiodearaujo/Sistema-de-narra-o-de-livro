-- Add missing columns to speeches table
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "scene_image_url" TEXT;
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "ambient_audio_url" TEXT;
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "audio_duration_ms" INTEGER;
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "start_time_ms" INTEGER;
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "end_time_ms" INTEGER;

-- Add missing columns to chapters table
ALTER TABLE "chapters" ADD COLUMN IF NOT EXISTS "soundtrack_url" TEXT;
ALTER TABLE "chapters" ADD COLUMN IF NOT EXISTS "soundtrack_volume" DOUBLE PRECISION DEFAULT 1.0;

-- Add missing columns to narrations table
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3);
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "total_duration_ms" INTEGER;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "total_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "completed_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "failed_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "timeline_json" JSONB;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "narrations" ADD COLUMN IF NOT EXISTS "error_message" TEXT;

-- CreateEnum for Audit (idempotent - ignore if already exists)
DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM (
        'AUTH_LOGIN', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT', 'AUTH_LOGOUT_ALL',
        'AUTH_SIGNUP', 'AUTH_TOKEN_REFRESH', 'AUTH_PASSWORD_CHANGE',
        'AUTH_PASSWORD_RESET_REQUEST', 'AUTH_PASSWORD_RESET_COMPLETE', 'AUTH_EMAIL_VERIFY',
        'BOOK_CREATE', 'BOOK_UPDATE', 'BOOK_DELETE', 'BOOK_VIEW',
        'CHAPTER_CREATE', 'CHAPTER_UPDATE', 'CHAPTER_DELETE', 'CHAPTER_REORDER',
        'CHARACTER_CREATE', 'CHARACTER_UPDATE', 'CHARACTER_DELETE',
        'SPEECH_CREATE', 'SPEECH_UPDATE', 'SPEECH_DELETE',
        'NARRATION_START', 'NARRATION_COMPLETE', 'NARRATION_FAIL',
        'AUDIO_GENERATE', 'AUDIO_DELETE',
        'POST_CREATE', 'POST_UPDATE', 'POST_DELETE',
        'COMMENT_CREATE', 'COMMENT_DELETE',
        'LIKE_TOGGLE', 'FOLLOW_TOGGLE',
        'MESSAGE_SEND', 'MESSAGE_DELETE',
        'PROFILE_UPDATE', 'AVATAR_UPLOAD',
        'GROUP_CREATE', 'GROUP_UPDATE', 'GROUP_DELETE',
        'GROUP_JOIN', 'GROUP_LEAVE', 'GROUP_MEMBER_ROLE_CHANGE', 'GROUP_MEMBER_REMOVE',
        'CAMPAIGN_CREATE', 'CAMPAIGN_UPDATE', 'CAMPAIGN_DELETE', 'CAMPAIGN_JOIN',
        'STORY_CREATE', 'STORY_DELETE',
        'SUBSCRIPTION_CREATE', 'SUBSCRIPTION_CANCEL', 'SUBSCRIPTION_UPGRADE', 'SUBSCRIPTION_DOWNGRADE',
        'LIVRA_PURCHASE', 'LIVRA_SPEND', 'LIVRA_EARN',
        'AI_TEXT_GENERATE', 'AI_IMAGE_GENERATE', 'AI_TTS_GENERATE',
        'ADMIN_USER_BAN', 'ADMIN_USER_UNBAN', 'ADMIN_USER_ROLE_CHANGE',
        'ADMIN_CONTENT_REMOVE', 'ADMIN_CONFIG_CHANGE',
        'RATE_LIMIT_EXCEEDED', 'PERMISSION_DENIED', 'PLAN_LIMIT_REACHED', 'SYSTEM_MAINTENANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditCategory" AS ENUM (
        'AUTH', 'BOOK', 'CHAPTER', 'CHARACTER', 'SPEECH', 'NARRATION',
        'SOCIAL', 'MESSAGE', 'PROFILE', 'GROUP', 'CAMPAIGN', 'STORY',
        'FINANCIAL', 'AI', 'ADMIN', 'SYSTEM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuditSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable audit_logs (idempotent)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
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

-- CreateIndex for audit_logs (idempotent)
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_category_idx" ON "audit_logs"("category");
CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs"("severity");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_success_idx" ON "audit_logs"("success");
CREATE INDEX IF NOT EXISTS "audit_logs_ipAddress_idx" ON "audit_logs"("ipAddress");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_created_at_idx" ON "audit_logs"("userId", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_category_created_at_idx" ON "audit_logs"("category", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- AddForeignKey for audit_logs (idempotent)
DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable oauth_clients (idempotent)
CREATE TABLE IF NOT EXISTS "oauth_clients" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowed_redirect_uris" TEXT[],
    "allowed_scopes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_clients_client_id_key" ON "oauth_clients"("client_id");

-- CreateTable oauth_authorization_codes (idempotent)
CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
    "id" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_authorization_codes_code_key" ON "oauth_authorization_codes"("code");
CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_code_idx" ON "oauth_authorization_codes"("code");
CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_expires_at_idx" ON "oauth_authorization_codes"("expires_at");

-- AddForeignKey (idempotent)
DO $$ BEGIN
    ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
