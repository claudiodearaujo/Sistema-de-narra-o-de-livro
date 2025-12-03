const { Client } = require('pg');

const connectionString = 'postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4npoler433s73e9ic9g-a.oregon-postgres.render.com/sistema_de_narracao_de_livros';

console.log('🔍 Testando conexão com o NOVO banco de dados...\n');

async function testConnection() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔄 Conectando...');
        await client.connect();
        console.log('✅ Conexão estabelecida com sucesso!\n');

        const result = await client.query('SELECT NOW(), version()');
        console.log('⏰ Hora do servidor:', result.rows[0].now);
        console.log('📦 Versão PostgreSQL:', result.rows[0].version.split(',')[0]);

        // Verificar tabelas existentes
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('\n📊 Tabelas existentes:', tables.rows.length);
        if (tables.rows.length > 0) {
            tables.rows.forEach(row => console.log('   -', row.table_name));
        } else {
            console.log('   ✨ Banco de dados vazio - pronto para receber o schema!');
        }

        await client.end();
        console.log('\n✅ Teste concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na conexão:');
        console.error('   Mensagem:', error.message);
        console.error('   Código:', error.code);
        if (client) await client.end();
        process.exit(1);
    }
}

testConnection();
