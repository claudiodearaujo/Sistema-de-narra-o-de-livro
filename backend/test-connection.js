const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        await client.connect();
        console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

        const result = await client.query('SELECT NOW()');
        console.log('⏰ Hora do servidor:', result.rows[0].now);

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:');
        console.error(error.message);
        process.exit(1);
    }
}

testConnection();
