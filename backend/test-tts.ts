import dotenv from 'dotenv';
dotenv.config();

async function testTTS() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'gemini-2.5-flash-preview-tts';
    
    const voices = ['Puck', 'Kore', 'Schedar'];
    
    for (const voiceName of voices) {
        console.log(`\n🎤 Testando voz: ${voiceName}`);
        
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Olá, eu sou a voz ${voiceName}!` }] }],
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: voiceName }
                                }
                            }
                        }
                    })
                }
            );
            
            const data = await response.json();
            
            if (data.error) {
                console.log(`❌ Erro: ${data.error.message}`);
            } else {
                const audioLength = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.length || 0;
                console.log(`✅ Sucesso! Tamanho do áudio: ${audioLength} caracteres base64`);
            }
        } catch (error: any) {
            console.log(`❌ Erro: ${error.message}`);
        }
    }
}

testTTS();
