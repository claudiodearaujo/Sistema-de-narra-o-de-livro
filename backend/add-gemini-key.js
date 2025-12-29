const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const geminiApiKey = 'AIzaSyDEyqmMARQAiXyHwL7Tw_d6n6eEcqgXdEY';

console.log('🔧 Adicionando Gemini API Key ao arquivo .env...\n');

try {
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Arquivo .env encontrado');

        // Verificar se já tem GEMINI_API_KEY
        if (envContent.includes('GEMINI_API_KEY=')) {
            // Substituir a GEMINI_API_KEY existente
            envContent = envContent.replace(
                /GEMINI_API_KEY=.*/,
                `GEMINI_API_KEY="${geminiApiKey}"`
            );
            console.log('✏️  GEMINI_API_KEY atualizada');
        } else {
            // Adicionar GEMINI_API_KEY
            envContent += `\n# Google Gemini API\nGEMINI_API_KEY="${geminiApiKey}"\n`;
            console.log('➕ GEMINI_API_KEY adicionada');
        }
    } else {
        console.log('❌ Arquivo .env não encontrado');
        process.exit(1);
    }

    // Escrever o arquivo .env
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('\n✅ Arquivo .env atualizado com sucesso!');
    console.log('📍 Localização:', envPath);
    console.log('\n🔑 Gemini API Key configurada!');
    console.log('\n✅ Agora você pode iniciar o servidor com "npm run dev" ou "npm start"\n');

} catch (error) {
    console.error('❌ Erro ao atualizar .env:', error.message);
    process.exit(1);
}
