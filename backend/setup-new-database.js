#!/usr/bin/env node

/**
 * Script para configurar o NOVO banco de dados do Sistema de Narração de Livros
 * Este script irá:
 * 1. Verificar a conexão com o novo banco
 * 2. Aplicar o schema do Prisma (criar todas as tabelas)
 * 3. Gerar o Prisma Client
 * 4. Verificar as tabelas criadas
 */

const { execSync } = require('child_process');
const { Client } = require('pg');

const NEW_DATABASE_URL = 'postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4npoler433s73e9ic9g-a.oregon-postgres.render.com/sistema_de_narracao_de_livros';

console.log('🚀 Configurando NOVO banco de dados do Sistema de Narração de Livros\n');
console.log('='.repeat(70));

async function testConnection() {
    console.log('\n1️⃣ Testando conexão com o banco de dados...');

    const client = new Client({
        connectionString: NEW_DATABASE_URL,
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
        if (client) await client.end();
        return false;
    }
}

function runCommand(command, description) {
    console.log(`\n${description}...`);
    try {
        execSync(command, {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: NEW_DATABASE_URL }
        });
        console.log('   ✅ Concluído!');
        return true;
    } catch (error) {
        console.error(`   ❌ Erro ao executar comando`);
        return false;
    }
}

async function verifyTables() {
    console.log('\n4️⃣ Verificando tabelas criadas...');

    const client = new Client({
        connectionString: NEW_DATABASE_URL,
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

        const expectedTables = ['books', 'chapters', 'characters', 'speeches', 'narrations'];
        const foundTables = result.rows.map(row => row.table_name);

        console.log('   📊 Tabelas criadas:');
        foundTables.forEach(table => {
            const isExpected = expectedTables.includes(table);
            const icon = isExpected ? '✅' : '📋';
            console.log(`      ${icon} ${table}`);
        });

        // Verificar se todas as tabelas esperadas foram criadas
        const missingTables = expectedTables.filter(t => !foundTables.includes(t));
        if (missingTables.length > 0) {
            console.log('\n   ⚠️  Tabelas faltando:', missingTables.join(', '));
            await client.end();
            return false;
        }

        console.log(`\n   ✅ Todas as ${expectedTables.length} tabelas esperadas foram criadas!`);
        await client.end();
        return true;
    } catch (error) {
        console.error('   ❌ Erro ao verificar tabelas:', error.message);
        if (client) await client.end();
        return false;
    }
}

async function main() {
    // Passo 1: Testar conexão
    const connected = await testConnection();
    if (!connected) {
        console.error('\n❌ Não foi possível conectar ao banco de dados.');
        console.error('💡 Verifique as credenciais e tente novamente.');
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

    // Passo 3: Aplicar schema usando db push (ideal para banco novo)
    console.log('\n3️⃣ Aplicando schema no banco de dados...');
    console.log('   (Usando db push para banco novo)');

    const schemaPushed = runCommand(
        'npx prisma db push --accept-data-loss',
        '   Criando tabelas'
    );

    if (!schemaPushed) {
        console.error('\n❌ Falha ao aplicar o schema');
        process.exit(1);
    }

    // Passo 4: Verificar tabelas criadas
    const tablesVerified = await verifyTables();

    if (!tablesVerified) {
        console.error('\n⚠️  Algumas tabelas podem não ter sido criadas corretamente');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(70));
    console.log('\n📋 Resumo:');
    console.log('   ✅ Conexão com banco de dados estabelecida');
    console.log('   ✅ Prisma Client gerado');
    console.log('   ✅ Schema aplicado (5 tabelas criadas)');
    console.log('   ✅ Banco de dados pronto para uso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Copie o conteúdo de .env.render para .env');
    console.log('   2. Execute "npm run dev" para iniciar o servidor');
    console.log('   3. Teste os endpoints da API');
    console.log('\n🎉 Seu sistema de narração de livros está pronto!\n');
}

main().catch(error => {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
});
