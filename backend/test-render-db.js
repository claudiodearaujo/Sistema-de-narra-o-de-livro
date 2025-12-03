const { Client } = require('pg');

// Credenciais fornecidas pelo usuário
const connectionConfig = {
    host: 'dpg-d4hg9r9r0fns73a7v4c0-a.oregon-postgres.render.com',
    database: 'sistema_de_narracao_de_livros',
    user: 'sistema_de_narracao_de_livros_user',
    password: 'snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

// URL de conexão completa
const connectionString = 'postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4hg9r9r0fns73a7v4c0-a.oregon-postgres.render.com/sistema_de_narracao_de_livros';

console.log('🔍 Testando conexão com o banco de dados Render...\n');
console.log('📋 Configuração:');
console.log('   Host:', connectionConfig.host);
console.log('   Database:', connectionConfig.database);
console.log('   User:', connectionConfig.user);
console.log('   Port:', connectionConfig.port);
console.log('   SSL: Habilitado\n');

async function testWithConfig() {
    const client = new Client(connectionConfig);

    try {
        console.log('🔄 Tentando conectar usando configuração individual...');
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!\n');

        const result = await client.query('SELECT NOW(), version()');
        console.log('⏰ Hora do servidor:', result.rows[0].now);
        console.log('📦 Versão do PostgreSQL:', result.rows[0].version.split(',')[0]);

        // Testar se há tabelas
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\n📊 Tabelas encontradas:', tables.rows.length);
        if (tables.rows.length > 0) {
            tables.rows.forEach(row => console.log('   -', row.table_name));
        }

        await client.end();
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com configuração individual:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code);
        if (client) await client.end();
        return false;
    }
}

async function testWithConnectionString() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('\n🔄 Tentando conectar usando connection string...');
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!\n');

        const result = await client.query('SELECT NOW()');
        console.log('⏰ Hora do servidor:', result.rows[0].now);

        await client.end();
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão com connection string:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code);
        if (client) await client.end();
        return false;
    }
}

async function main() {
    const test1 = await testWithConfig();
    const test2 = await testWithConnectionString();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES:');
    console.log('   Configuração individual:', test1 ? '✅ Sucesso' : '❌ Falhou');
    console.log('   Connection string:', test2 ? '✅ Sucesso' : '❌ Falhou');
    console.log('='.repeat(60));

    if (!test1 && !test2) {
        console.log('\n⚠️  Nenhum método de conexão funcionou.');
        console.log('💡 Possíveis causas:');
        console.log('   1. Firewall bloqueando a conexão');
        console.log('   2. Banco de dados pausado ou indisponível no Render');
        console.log('   3. Credenciais incorretas');
        console.log('   4. Restrições de IP no Render');
        process.exit(1);
    } else {
        console.log('\n✅ Pelo menos um método de conexão funcionou!');
        process.exit(0);
    }
}

main();
