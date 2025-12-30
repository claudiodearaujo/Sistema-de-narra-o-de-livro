-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'WRITER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'GITHUB');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "provider_id" TEXT,
    "verify_token" TEXT,
    "verify_expires" TIMESTAMP(3),
    "reset_token" TEXT,
    "reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "voice_description" TEXT,
    "preview_audio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_identities" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "nationality" TEXT,
    "occupation" TEXT,
    "birth_date" TEXT,
    "birth_place" TEXT,
    "personality" TEXT,
    "background" TEXT,

    CONSTRAINT "character_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_physiques" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "height" TEXT,
    "weight" TEXT,
    "body_type" TEXT,
    "waist" TEXT,
    "posture" TEXT,
    "skin_tone" TEXT,
    "skin_texture" TEXT,
    "scars" TEXT,
    "tattoos" TEXT,
    "birthmarks" TEXT,

    CONSTRAINT "character_physiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_faces" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "face_shape" TEXT,
    "forehead" TEXT,
    "cheekbones" TEXT,
    "chin" TEXT,
    "jaw" TEXT,
    "nose" TEXT,
    "lips" TEXT,
    "expression" TEXT,
    "beard" TEXT,
    "mustache" TEXT,
    "wrinkles" TEXT,
    "dimples" TEXT,
    "freckles" TEXT,

    CONSTRAINT "character_faces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_eyes" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "eye_size" TEXT,
    "eye_shape" TEXT,
    "eye_color" TEXT,
    "eye_spacing" TEXT,
    "eyelashes" TEXT,
    "eyebrow_shape" TEXT,
    "eyebrow_color" TEXT,
    "eyebrow_thickness" TEXT,
    "glasses" TEXT,
    "makeup" TEXT,

    CONSTRAINT "character_eyes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_hairs" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "haircut" TEXT,
    "hair_length" TEXT,
    "hair_color" TEXT,
    "hair_texture" TEXT,
    "hair_volume" TEXT,
    "hair_style" TEXT,
    "hair_part" TEXT,
    "hair_shine" TEXT,
    "dyed_color" TEXT,
    "highlights" TEXT,

    CONSTRAINT "character_hairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_wardrobes" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "clothing_style" TEXT,
    "topwear" TEXT,
    "topwear_color" TEXT,
    "topwear_brand" TEXT,
    "bottomwear" TEXT,
    "bottomwear_color" TEXT,
    "bottomwear_brand" TEXT,
    "dress" TEXT,
    "dress_color" TEXT,
    "dress_brand" TEXT,
    "footwear" TEXT,
    "footwear_color" TEXT,
    "footwear_brand" TEXT,
    "heel_height" TEXT,
    "earrings" TEXT,
    "necklace" TEXT,
    "rings" TEXT,
    "bracelets" TEXT,
    "watch" TEXT,
    "bag" TEXT,
    "hat" TEXT,
    "scarf" TEXT,
    "nails" TEXT,
    "perfume" TEXT,

    CONSTRAINT "character_wardrobes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speeches" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "ssml_text" TEXT,
    "order_index" INTEGER NOT NULL,
    "audio_url" TEXT,

    CONSTRAINT "speeches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrations" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output_url" TEXT,
    "drive_file_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_voices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "voice_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_voices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "books_user_id_idx" ON "books"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_identities_character_id_key" ON "character_identities"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_physiques_character_id_key" ON "character_physiques"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_faces_character_id_key" ON "character_faces"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_eyes_character_id_key" ON "character_eyes"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_hairs_character_id_key" ON "character_hairs"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "character_wardrobes_character_id_key" ON "character_wardrobes"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "narrations_chapter_id_key" ON "narrations"("chapter_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_voices_name_key" ON "custom_voices"("name");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_identities" ADD CONSTRAINT "character_identities_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_physiques" ADD CONSTRAINT "character_physiques_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_faces" ADD CONSTRAINT "character_faces_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_eyes" ADD CONSTRAINT "character_eyes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_hairs" ADD CONSTRAINT "character_hairs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_wardrobes" ADD CONSTRAINT "character_wardrobes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeches" ADD CONSTRAINT "speeches_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrations" ADD CONSTRAINT "narrations_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
