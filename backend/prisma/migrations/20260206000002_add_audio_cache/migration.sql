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

-- CreateIndex
CREATE UNIQUE INDEX "audio_cache_text_hash_key" ON "audio_cache"("text_hash");

-- CreateIndex
CREATE INDEX "audio_cache_text_hash_idx" ON "audio_cache"("text_hash");

-- CreateIndex
CREATE INDEX "audio_cache_voice_id_idx" ON "audio_cache"("voice_id");

-- CreateIndex
CREATE INDEX "audio_cache_provider_idx" ON "audio_cache"("provider");

-- CreateIndex
CREATE INDEX "audio_cache_last_accessed_at_idx" ON "audio_cache"("last_accessed_at");

-- CreateIndex
CREATE INDEX "audio_cache_created_at_idx" ON "audio_cache"("created_at");
