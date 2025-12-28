const { execSync } = require('child_process');

// URL com password URL-encoded: @ -> %40, # -> %23, $ -> %24, + -> %2B
const SUPABASE_URL = "postgresql://postgres.jgxxxrharzrnlwdwcscf:Fz9dvKr%40%23M%24w%2B9f@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

console.log("Criando schema no Supabase...");

try {
    execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: SUPABASE_URL },
        stdio: 'inherit'
    });
    console.log("Schema criado com sucesso!");
} catch (e) {
    console.error("Erro ao criar schema:", e.message);
    process.exit(1);
}
