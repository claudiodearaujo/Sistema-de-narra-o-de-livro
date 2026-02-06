-- CreateEnum
CREATE TYPE "AIOperationType" AS ENUM (
    'TTS_GENERATE',
    'TTS_PREVIEW',
    'TTS_VOICES_LIST',
    'TEXT_GENERATE',
    'TEXT_SPELLCHECK',
    'TEXT_SUGGEST',
    'TEXT_ENRICH',
    'IMAGE_GENERATE',
    'IMAGE_EMOTION',
    'NARRATION_CHAPTER'
);

-- CreateEnum
CREATE TYPE "AIProviderName" AS ENUM (
    'GEMINI',
    'ELEVENLABS',
    'OPENAI',
    'ANTHROPIC',
    'STABILITY',
    'AZURE'
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
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
    "livras_cost" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_idx" ON "ai_usage_logs"("user_id");

-- CreateIndex
CREATE INDEX "ai_usage_logs_operation_idx" ON "ai_usage_logs"("operation");

-- CreateIndex
CREATE INDEX "ai_usage_logs_provider_idx" ON "ai_usage_logs"("provider");

-- CreateIndex
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_created_at_idx" ON "ai_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_operation_idx" ON "ai_usage_logs"("user_id", "operation");

-- CreateIndex
CREATE INDEX "ai_usage_logs_provider_created_at_idx" ON "ai_usage_logs"("provider", "created_at");

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
