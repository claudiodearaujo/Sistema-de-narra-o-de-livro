const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const newDatabaseUrl = 'postgresql://sistema_de_narracao_de_livros_user:snBtufNTkLlWxXbEkVn8dCSk4xYZwGIs@dpg-d4npoler433s73e9ic9g-a.oregon-postgres.render.com/sistema_de_narracao_de_livros';

console.log('🔧 Atualizando arquivo .env...\n');

try {
    let envContent = '';

    // Tentar ler o arquivo .env existente
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Arquivo .env existente encontrado');

        // Verificar se já tem DATABASE_URL
        if (envContent.includes('DATABASE_URL=')) {
            // Substituir a DATABASE_URL existente
            envContent = envContent.replace(
                /DATABASE_URL=.*/,
                `DATABASE_URL="${newDatabaseUrl}"`
            );
            console.log('✏️  DATABASE_URL atualizada');
        } else {
            // Adicionar DATABASE_URL
            envContent = `DATABASE_URL="${newDatabaseUrl}"\n${envContent}`;
            console.log('➕ DATABASE_URL adicionada');
        }
    } else {
        // Criar novo arquivo .env
        console.log('📝 Criando novo arquivo .env');
        envContent = `# Configuração do Banco de Dados - Sistema de Narração de Livros
DATABASE_URL="${newDatabaseUrl}"

# JWT Secret (troque por uma chave segura em produção)
JWT_SECRET="sua-chave-secreta-jwt-aqui-troque-por-uma-chave-segura"

# Porta do servidor
PORT=3000

# Ambiente
NODE_ENV="development"
`;
    }

    // Escrever o arquivo .env
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n✅ Arquivo .env atualizado com sucesso!');
    console.log('📍 Localização:', envPath);
    console.log('\n🔗 Nova DATABASE_URL configurada:');
    console.log('   Host: dpg-d4npoler433s73e9ic9g-a.oregon-postgres.render.com');
    console.log('   Database: sistema_de_narracao_de_livros');
    console.log('   User: sistema_de_narracao_de_livros_user');
    console.log('\n✅ Pronto! Você pode iniciar o servidor com "npm run dev"\n');

} catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
    console.log('\n💡 Solução manual:');
    console.log('   1. Abra o arquivo .env');
    console.log('   2. Atualize a linha DATABASE_URL com:');
    console.log(`   DATABASE_URL="${newDatabaseUrl}"`);
    process.exit(1);
}
