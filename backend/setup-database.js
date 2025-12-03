#!/usr/bin/env node

/**
 * Script para configurar o banco de dados no Render
 * Este script irá:
 * 1. Verificar a conexão com o banco
 * 2. Aplicar as migrations do Prisma
 * 3. Gerar o Prisma Client
 */

const { execSync } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL ||
    'postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4hg9r9r0fns73a7v4c0-a.oregon-postgres.render.com/sistema_de_narracao_de_livros';

console.log('🚀 Iniciando configuração do banco de dados...\n');

async function testConnection() {
    console.log('1️⃣ Testando conexão com o banco de dados...');

    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const result = await client.query('SELECT NOW()');
        console.log('   ✅ Conexão estabelecida com sucesso!');
        console.log('   ⏰ Hora do servidor:', result.rows[0].now);
        await client.end();
        return true;
    } catch (error) {
        console.error('   ❌ Erro ao conectar:', error.message);
        await client.end();
        return false;
    }
}

function runCommand(command, description) {
    console.log(`\n${description}...`);
    try {
        execSync(command, {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL }
        });
        console.log('   ✅ Concluído!');
        return true;
    } catch (error) {
        console.error(`   ❌ Erro ao executar: ${command}`);
        console.error('   ', error.message);
        return false;
    }
}

async function main() {
    // Passo 1: Testar conexão
    const connected = await testConnection();
    if (!connected) {
        console.error('\n❌ Não foi possível conectar ao banco de dados.');
        console.error('💡 Verifique se:');
        console.error('   - O banco de dados está ativo no Render');
        console.error('   - As credenciais estão corretas no arquivo .env');
        console.error('   - Não há firewall bloqueando a conexão');
        process.exit(1);
    }

    // Passo 2: Gerar Prisma Client
    const clientGenerated = runCommand(
        'npx prisma generate',
        '2️⃣ Gerando Prisma Client'
    );

    if (!clientGenerated) {
        console.error('\n❌ Falha ao gerar o Prisma Client');
        process.exit(1);
    }

    // Passo 3: Aplicar migrations
    const migrationsApplied = runCommand(
        'npx prisma migrate deploy',
        '3️⃣ Aplicando migrations no banco de dados'
    );

    if (!migrationsApplied) {
        console.log('\n⚠️  Migrations não aplicadas. Tentando criar uma nova migration...');

        const migrationCreated = runCommand(
            'npx prisma migrate dev --name init',
            '   Criando migration inicial'
        );

        if (!migrationCreated) {
            console.error('\n❌ Falha ao criar/aplicar migrations');
            process.exit(1);
        }
    }

    // Passo 4: Verificar tabelas criadas
    console.log('\n4️⃣ Verificando tabelas criadas...');
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('   ✅ Tabelas encontradas:');
        result.rows.forEach(row => {
            console.log(`      - ${row.table_name}`);
        });

        await client.end();
    } catch (error) {
        console.error('   ❌ Erro ao verificar tabelas:', error.message);
        await client.end();
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuração do banco de dados concluída com sucesso!');
    console.log('='.repeat(60));
    console.log('\n💡 Próximos passos:');
    console.log('   1. Certifique-se de que o arquivo .env contém a DATABASE_URL correta');
    console.log('   2. Execute "npm run dev" para iniciar o servidor');
    console.log('   3. Teste os endpoints da API\n');
}

main().catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
});
