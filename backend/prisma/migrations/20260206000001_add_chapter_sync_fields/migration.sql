-- AlterTable: Add timeline fields to Speech
ALTER TABLE "speeches" ADD COLUMN "audio_duration_ms" INTEGER;
ALTER TABLE "speeches" ADD COLUMN "start_time_ms" INTEGER;
ALTER TABLE "speeches" ADD COLUMN "end_time_ms" INTEGER;

-- AlterTable: Add sync fields to Narration
ALTER TABLE "narrations" ADD COLUMN "total_duration_ms" INTEGER;
ALTER TABLE "narrations" ADD COLUMN "total_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN "completed_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN "failed_speeches" INTEGER;
ALTER TABLE "narrations" ADD COLUMN "timeline_json" JSONB;
ALTER TABLE "narrations" ADD COLUMN "provider" TEXT;
ALTER TABLE "narrations" ADD COLUMN "error_message" TEXT;
ALTER TABLE "narrations" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "narrations" ADD COLUMN "started_at" TIMESTAMP(3);
ALTER TABLE "narrations" ADD COLUMN "completed_at" TIMESTAMP(3);
