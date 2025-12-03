const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Desabilitando Redis no arquivo .env...\n');

try {
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Arquivo .env encontrado');

        // Verificar se já tem REDIS_ENABLED
        if (envContent.includes('REDIS_ENABLED=')) {
            // Substituir
            envContent = envContent.replace(
                /REDIS_ENABLED=.*/,
                'REDIS_ENABLED=false'
            );
            console.log('✏️  REDIS_ENABLED atualizada para false');
        } else {
            // Adicionar
            envContent += '\n# Redis (opcional - para filas de processamento assíncrono)\nREDIS_ENABLED=false\n';
            console.log('➕ REDIS_ENABLED=false adicionada');
        }
    } else {
        console.log('❌ Arquivo .env não encontrado');
        process.exit(1);
    }

    // Escrever o arquivo .env
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n✅ Redis desabilitado com sucesso!');
    console.log('📍 O servidor funcionará sem Redis (processamento síncrono)');
    console.log('\n💡 Para habilitar Redis no futuro:');
    console.log('   1. Instale e inicie o Redis');
    console.log('   2. Altere REDIS_ENABLED=true no .env\n');

} catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
    process.exit(1);
}
