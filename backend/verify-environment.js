#!/usr/bin/env node

/**
 * Verificação completa do ambiente antes de iniciar o servidor
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Verificação Completa do Ambiente\n');
console.log('='.repeat(70));

let hasErrors = false;
let hasWarnings = false;

// 1. Verificar .env
console.log('\n1️⃣ Arquivo .env');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('   ✅ Arquivo .env encontrado');
} else {
    console.log('   ❌ Arquivo .env NÃO encontrado');
    hasErrors = true;
}

// 2. Verificar DATABASE_URL
console.log('\n2️⃣ DATABASE_URL');
if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.includes('sistema_de_narracao_de_livros')) {
        console.log('   ✅ DATABASE_URL configurada corretamente');
    } else {
        console.log('   ⚠️  DATABASE_URL pode estar incorreta');
        hasWarnings = true;
    }
} else {
    console.log('   ❌ DATABASE_URL NÃO configurada');
    hasErrors = true;
}

// 3. Verificar GEMINI_API_KEY
console.log('\n3️⃣ GEMINI_API_KEY');
if (process.env.GEMINI_API_KEY) {
    const keyLength = process.env.GEMINI_API_KEY.length;
    console.log(`   ✅ GEMINI_API_KEY configurada (${keyLength} caracteres)`);
} else {
    console.log('   ❌ GEMINI_API_KEY NÃO configurada');
    hasErrors = true;
}

// 4. Verificar PORT
console.log('\n4️⃣ PORT');
const port = process.env.PORT || 3000;
console.log(`   ✅ Porta configurada: ${port}`);

// 5. Verificar JWT_SECRET
console.log('\n5️⃣ JWT_SECRET');
if (process.env.JWT_SECRET) {
    console.log('   ✅ JWT_SECRET configurada');
} else {
    console.log('   ⚠️  JWT_SECRET não configurada (recomendado para produção)');
    hasWarnings = true;
}

// 6. Verificar NODE_ENV
console.log('\n6️⃣ NODE_ENV');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`   ✅ Ambiente: ${nodeEnv}`);

// 7. Verificar Prisma Client
console.log('\n7️⃣ Prisma Client');
const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
    console.log('   ✅ Prisma Client instalado');
} else {
    console.log('   ❌ Prisma Client NÃO instalado');
    console.log('   💡 Execute: npx prisma generate');
    hasErrors = true;
}

// 8. Testar conexão com banco de dados
async function testDatabase() {
    console.log('\n8️⃣ Conexão com Banco de Dados');

    if (!process.env.DATABASE_URL) {
        console.log('   ⏭️  Pulando teste (DATABASE_URL não configurada)');
        return false;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('   ✅ Conexão estabelecida com sucesso');

        const result = await client.query(`
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const tableCount = parseInt(result.rows[0].table_count);

        if (tableCount >= 5) {
            console.log(`   ✅ ${tableCount} tabelas encontradas`);
        } else {
            console.log(`   ⚠️  Apenas ${tableCount} tabelas (esperado: 5)`);
            hasWarnings = true;
        }

        await client.end();
        return true;
    } catch (error) {
        console.log('   ❌ Erro ao conectar:', error.message);
        await client.end();
        hasErrors = true;
        return false;
    }
}

// 9. Verificar estrutura de diretórios
console.log('\n9️⃣ Estrutura de Diretórios');
const requiredDirs = ['src', 'src/routes', 'src/controllers', 'src/services', 'src/tts', 'prisma'];
let allDirsExist = true;

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`   ✅ ${dir}/`);
    } else {
        console.log(`   ⚠️  ${dir}/ não encontrado`);
        allDirsExist = false;
        hasWarnings = true;
    }
});

// Executar verificações assíncronas
async function runChecks() {
    await testDatabase();

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(70));

    if (hasErrors) {
        console.log('\n❌ ERROS ENCONTRADOS - Corrija antes de iniciar o servidor\n');
        console.log('💡 Checklist de correção:');
        if (!fs.existsSync(envPath)) {
            console.log('   [ ] Criar arquivo .env');
        }
        if (!process.env.DATABASE_URL) {
            console.log('   [ ] Configurar DATABASE_URL no .env');
        }
        if (!process.env.GEMINI_API_KEY) {
            console.log('   [ ] Configurar GEMINI_API_KEY no .env');
        }
        if (!fs.existsSync(prismaClientPath)) {
            console.log('   [ ] Executar: npx prisma generate');
        }
        console.log('\n');
        process.exit(1);
    } else if (hasWarnings) {
        console.log('\n⚠️  AVISOS ENCONTRADOS - Servidor pode iniciar, mas revise os avisos\n');
        console.log('✅ Você pode iniciar o servidor com:');
        console.log('   npm run dev    (desenvolvimento)');
        console.log('   npm start      (produção)\n');
        process.exit(0);
    } else {
        console.log('\n✅ TUDO PERFEITO! Ambiente 100% configurado!\n');
        console.log('🚀 Pronto para iniciar o servidor!');
        console.log('\n💡 Comandos disponíveis:');
        console.log('   npm run dev    - Iniciar em modo desenvolvimento (com hot reload)');
        console.log('   npm start      - Iniciar em modo produção');
        console.log('   npm run build  - Compilar TypeScript para JavaScript\n');
        console.log('📡 Servidor estará disponível em:');
        console.log(`   http://localhost:${port}\n`);
        console.log('📚 Endpoints principais:');
        console.log('   GET  /                    - Health check');
        console.log('   GET  /api/books           - Listar livros');
        console.log('   POST /api/books           - Criar livro');
        console.log('   GET  /api/voices          - Listar vozes disponíveis\n');
        process.exit(0);
    }
}

runChecks();
