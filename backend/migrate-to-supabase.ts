
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const RENDER_URL = "postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4npoler433s73e9ic9g-a.oregon-postgres.render.com/sistema_de_narracao_de_livros";
// Using DIRECT_URL for Supabase as recommended for migrations and connection via scripts
const SUPABASE_URL = "postgresql://postgres.jgxxxrharzrnlwdwcscf:Fz9dvKr%40%23M%24w%2B9f@aws-0-us-west-2.pooler.supabase.com:5432/postgres";
// Note: I encoded the password special characters: @ -> %40, # -> %23, $ -> %24, + -> %2B just in case, but let's try the original first if this fails.
// Actually, let's use the exact string from the file first, but be careful with the @ parsing.
// The file has: Fz9dvKr@#M$w+9f
// In URL: postgresql://user:pass@word@host... parser splits on last @.
// Let's use the string exactly as in .env.supabase first.
const SUPABASE_URL_RAW = "postgresql://postgres.jgxxxrharzrnlwdwcscf:Fz9dvKr@#M$w+9f@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

async function main() {
    console.log("Iniciando migração...");

    // 1. Push Schema directly using shell command
    console.log("1. Atualizando schema no Supabase...");
    try {
        // Windows pwsh style env var setting
        // We escape special chars for the shell if needed, but in Node's execSync with 'env' option is safer.
        execSync('npx prisma db push --accept-data-loss', {
            env: { ...process.env, DATABASE_URL: SUPABASE_URL_RAW },
            stdio: 'inherit'
        });
        console.log("Schema atualizado com sucesso.");
    } catch (e) {
        console.error("Erro ao atualizar schema:", e);
        process.exit(1);
    }

    // 2. Data Migration
    console.log("2. Migrando dados...");

    const source = new PrismaClient({
        datasources: { db: { url: RENDER_URL } },
    });

    const target = new PrismaClient({
        datasources: { db: { url: SUPABASE_URL_RAW } },
    });

    try {
        // Connect both
        await source.$connect();
        await target.$connect();

        // Migrate CustomVoice
        console.log("Migrando CustomVoice...");
        const voices = await source.customVoice.findMany();
        console.log(`Encontradas ${voices.length} vozes.`);
        for (const voice of voices) {
            // Upsert to avoid duplicates if run multiple times
            await target.customVoice.upsert({
                where: { id: voice.id },
                update: voice,
                create: voice,
            });
        }

        // Migrate Book
        console.log("Migrando Books...");
        const books = await source.book.findMany();
        console.log(`Encontrados ${books.length} livros.`);
        for (const book of books) {
            await target.book.upsert({
                where: { id: book.id },
                update: book,
                create: book,
            });
        }

        // Migrate Chapter (depends on Book)
        console.log("Migrando Chapters...");
        const chapters = await source.chapter.findMany();
        console.log(`Encontrados ${chapters.length} capítulos.`);
        for (const chapter of chapters) {
            await target.chapter.upsert({
                where: { id: chapter.id },
                update: chapter,
                create: chapter,
            });
        }

        // Migrate Character (depends on Book)
        console.log("Migrando Characters...");
        const characters = await source.character.findMany();
        console.log(`Encontrados ${characters.length} personagens.`);
        for (const char of characters) {
            await target.character.upsert({
                where: { id: char.id },
                update: char,
                create: char,
            });
        }

        // Migrate Speech (depends on Chapter and Character)
        console.log("Migrando Speeches...");
        // Fetch in chunks if too many, but for now assuming manageable size
        const speeches = await source.speech.findMany();
        console.log(`Encontrados ${speeches.length} falas.`);
        for (const speech of speeches) {
            await target.speech.upsert({
                where: { id: speech.id },
                update: speech,
                create: speech,
            });
        }

        // Migrate Narration (depends on Chapter)
        console.log("Migrando Narrations...");
        const narrations = await source.narration.findMany();
        console.log(`Encontradas ${narrations.length} narrações.`);
        for (const narration of narrations) {
            await target.narration.upsert({
                where: { id: narration.id },
                update: narration,
                create: narration,
            });
        }

        console.log("Migração concluída com sucesso!");

    } catch (error) {
        console.error("Erro durante a migração de dados:", error);
    } finally {
        await source.$disconnect();
        await target.$disconnect();
    }
}

main();
