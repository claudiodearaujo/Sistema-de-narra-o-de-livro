import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converte áudio PCM raw (do Gemini TTS) para MP3 usando FFmpeg
 * O Gemini TTS retorna PCM 24kHz, 16-bit, mono
 * @param pcmBuffer Buffer contendo o áudio PCM raw
 * @returns Promise<Buffer> Buffer contendo o áudio MP3
 */
export async function convertWavToMp3(pcmBuffer: Buffer): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const tempId = uuidv4();
    const inputPath = path.join(tempDir, `input_${tempId}.pcm`);
    const outputPath = path.join(tempDir, `output_${tempId}.mp3`);

    console.log('🔄 Convertendo PCM para MP3...');
    console.log(`   Input size: ${pcmBuffer.length} bytes`);

    try {
        // Escrever o buffer PCM em um arquivo temporário
        fs.writeFileSync(inputPath, pcmBuffer);

        // Executar FFmpeg para converter PCM raw para MP3
        // O Gemini TTS retorna: PCM 24kHz, 16-bit little-endian, mono
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-y',                    // Sobrescrever arquivo de saída
                '-f', 's16le',           // Formato de entrada: PCM signed 16-bit little-endian
                '-ar', '24000',          // Sample rate de entrada: 24kHz
                '-ac', '1',              // Canais de entrada: mono
                '-i', inputPath,         // Arquivo de entrada
                '-codec:a', 'libmp3lame', // Codec MP3
                '-b:a', '192k',          // Bitrate
                outputPath               // Arquivo de saída
            ]);

            let stderr = '';

            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Conversão para MP3 concluída');
                    resolve();
                } else {
                    console.error('❌ FFmpeg stderr:', stderr);
                    reject(new Error(`FFmpeg falhou com código ${code}`));
                }
            });

            ffmpeg.on('error', (err) => {
                reject(new Error(`Erro ao executar FFmpeg: ${err.message}`));
            });
        });

        // Ler o arquivo MP3 convertido
        const mp3Buffer = fs.readFileSync(outputPath);
        console.log(`   Output size: ${mp3Buffer.length} bytes`);

        return mp3Buffer;
    } finally {
        // Limpar arquivos temporários
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
            // Ignorar erros de limpeza
        }
    }
}

/**
 * Verifica se o FFmpeg está instalado e disponível
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);
        
        ffmpeg.on('close', (code) => {
            resolve(code === 0);
        });

        ffmpeg.on('error', () => {
            resolve(false);
        });
    });
}
