-- CreateEnum
CREATE TYPE "AIOperationType" AS ENUM ('TTS_GENERATE', 'TTS_PREVIEW', 'TTS_VOICES_LIST', 'TEXT_GENERATE', 'TEXT_SPELLCHECK', 'TEXT_SUGGEST', 'TEXT_ENRICH', 'IMAGE_GENERATE', 'IMAGE_EMOTION', 'NARRATION_CHAPTER');

-- CreateEnum
CREATE TYPE "AIProviderName" AS ENUM ('GEMINI', 'ELEVENLABS', 'OPENAI', 'ANTHROPIC', 'STABILITY', 'AZURE');

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT,
    "operation" "AIOperationType" NOT NULL,
    "provider" "AIProviderName" NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "input_chars" INTEGER NOT NULL DEFAULT 0,
    "output_bytes" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credits_cost" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_cache" (
    "id" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "audio_duration_ms" INTEGER NOT NULL,
    "audio_size_bytes" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'mp3',
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "audio_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "rate_limit" INTEGER NOT NULL DEFAULT 100,
    "monthly_quota" INTEGER,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
    "quota_reset_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "config" JSONB,
    "output_url" TEXT,
    "total_items" INTEGER,
    "completed_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "timeline_json" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_idx" ON "ai_usage_logs"("user_id");
CREATE INDEX "ai_usage_logs_client_id_idx" ON "ai_usage_logs"("client_id");
CREATE INDEX "ai_usage_logs_operation_idx" ON "ai_usage_logs"("operation");
CREATE INDEX "ai_usage_logs_provider_idx" ON "ai_usage_logs"("provider");
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");
CREATE INDEX "ai_usage_logs_user_id_created_at_idx" ON "ai_usage_logs"("user_id", "created_at");
CREATE INDEX "ai_usage_logs_user_id_operation_idx" ON "ai_usage_logs"("user_id", "operation");
CREATE INDEX "ai_usage_logs_provider_created_at_idx" ON "ai_usage_logs"("provider", "created_at");
CREATE INDEX "ai_usage_logs_client_id_created_at_idx" ON "ai_usage_logs"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audio_cache_text_hash_key" ON "audio_cache"("text_hash");
CREATE INDEX "audio_cache_text_hash_idx" ON "audio_cache"("text_hash");
CREATE INDEX "audio_cache_voice_id_idx" ON "audio_cache"("voice_id");
CREATE INDEX "audio_cache_provider_idx" ON "audio_cache"("provider");
CREATE INDEX "audio_cache_last_accessed_at_idx" ON "audio_cache"("last_accessed_at");
CREATE INDEX "audio_cache_created_at_idx" ON "audio_cache"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_is_active_idx" ON "api_keys"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "cost_configs_key_key" ON "cost_configs"("key");

-- CreateIndex
CREATE INDEX "sync_jobs_client_id_idx" ON "sync_jobs"("client_id");
CREATE INDEX "sync_jobs_user_id_idx" ON "sync_jobs"("user_id");
CREATE INDEX "sync_jobs_resource_type_resource_id_idx" ON "sync_jobs"("resource_type", "resource_id");
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");
CREATE INDEX "sync_jobs_created_at_idx" ON "sync_jobs"("created_at");
