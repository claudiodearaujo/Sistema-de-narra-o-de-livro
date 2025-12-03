#!/usr/bin/env node

/**
 * Script de verificação pré-inicialização do servidor
 * Verifica se tudo está configurado corretamente antes de iniciar o servidor
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Verificando configuração do servidor...\n');
console.log('='.repeat(70));

let hasErrors = false;

// Verificação 1: Arquivo .env
console.log('\n1️⃣ Verificando arquivo .env...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('   ✅ Arquivo .env encontrado');

    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('DATABASE_URL=')) {
        console.log('   ✅ DATABASE_URL configurada');
    } else {
        console.log('   ❌ DATABASE_URL não encontrada no .env');
        hasErrors = true;
    }
} else {
    console.log('   ❌ Arquivo .env não encontrado');
    hasErrors = true;
}

// Verificação 2: DATABASE_URL
console.log('\n2️⃣ Verificando DATABASE_URL...');
if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('sistema_de_narracao_de_livros')) {
        console.log('   ✅ DATABASE_URL aponta para o banco correto');
        console.log('   📍 Database: sistema_de_narracao_de_livros');
    } else {
        console.log('   ⚠️  DATABASE_URL pode estar incorreta');
        console.log('   📍 URL atual:', dbUrl.substring(0, 50) + '...');
    }
} else {
    console.log('   ❌ DATABASE_URL não definida');
    hasErrors = true;
}

// Verificação 3: Conexão com banco de dados
async function testDatabaseConnection() {
    console.log('\n3️⃣ Testando conexão com banco de dados...');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('   ✅ Conexão estabelecida com sucesso');

        const result = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
        const tableCount = parseInt(result.rows[0].table_count);

        if (tableCount >= 5) {
            console.log(`   ✅ ${tableCount} tabelas encontradas no banco`);
        } else {
            console.log(`   ⚠️  Apenas ${tableCount} tabelas encontradas (esperado: 5)`);
            console.log('   💡 Execute: npx prisma db push');
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

// Verificação 4: Prisma Client
console.log('\n4️⃣ Verificando Prisma Client...');
const prismaClientPath = path.join(__dirname, 'node_modules', '@prisma', 'client');
if (fs.existsSync(prismaClientPath)) {
    console.log('   ✅ Prisma Client instalado');
} else {
    console.log('   ❌ Prisma Client não encontrado');
    console.log('   💡 Execute: npx prisma generate');
    hasErrors = true;
}

// Verificação 5: Porta
console.log('\n5️⃣ Verificando configuração de porta...');
const port = process.env.PORT || 3000;
console.log(`   ✅ Servidor irá rodar na porta ${port}`);

// Verificação 6: Estrutura de diretórios
console.log('\n6️⃣ Verificando estrutura de diretórios...');
const requiredDirs = ['src', 'src/routes', 'src/controllers', 'src/services', 'prisma'];
let allDirsExist = true;

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`   ✅ ${dir}/`);
    } else {
        console.log(`   ⚠️  ${dir}/ não encontrado`);
        allDirsExist = false;
    }
});

// Executar teste de conexão
async function runChecks() {
    await testDatabaseConnection();

    console.log('\n' + '='.repeat(70));

    if (hasErrors) {
        console.log('❌ VERIFICAÇÃO FALHOU - Corrija os erros antes de iniciar o servidor');
        console.log('='.repeat(70));
        console.log('\n💡 Passos para corrigir:');
        console.log('   1. Certifique-se de que o arquivo .env existe');
        console.log('   2. Verifique se DATABASE_URL está configurada corretamente');
        console.log('   3. Execute: npx prisma generate');
        console.log('   4. Execute: npx prisma db push');
        console.log('   5. Tente novamente: node pre-start-check.js\n');
        process.exit(1);
    } else {
        console.log('✅ TODAS AS VERIFICAÇÕES PASSARAM!');
        console.log('='.repeat(70));
        console.log('\n🚀 Tudo pronto para iniciar o servidor!');
        console.log('\n💡 Para iniciar o servidor, execute:');
        console.log('   npm run dev    (modo desenvolvimento)');
        console.log('   npm start      (modo produção)\n');
        console.log('📡 O servidor estará disponível em:');
        console.log(`   http://localhost:${port}\n`);
        console.log('📚 Endpoints disponíveis:');
        console.log('   GET  /api/books           - Listar livros');
        console.log('   POST /api/books           - Criar livro');
        console.log('   GET  /api/books/:id       - Detalhes do livro');
        console.log('   GET  /api/books/:id/chapters - Capítulos do livro');
        console.log('   E muito mais...\n');
        process.exit(0);
    }
}

runChecks();
