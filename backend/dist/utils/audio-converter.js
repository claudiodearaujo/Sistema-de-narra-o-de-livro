"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertWavToMp3 = convertWavToMp3;
exports.checkFfmpegInstalled = checkFfmpegInstalled;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const uuid_1 = require("uuid");
/**
 * Converte áudio PCM raw (do Gemini TTS) para MP3 usando FFmpeg
 * O Gemini TTS retorna PCM 24kHz, 16-bit, mono
 * @param pcmBuffer Buffer contendo o áudio PCM raw
 * @returns Promise<Buffer> Buffer contendo o áudio MP3
 */
async function convertWavToMp3(pcmBuffer) {
    const tempDir = os.tmpdir();
    const tempId = (0, uuid_1.v4)();
    const inputPath = path.join(tempDir, `input_${tempId}.pcm`);
    const outputPath = path.join(tempDir, `output_${tempId}.mp3`);
    console.log('🔄 Convertendo PCM para MP3...');
    console.log(`   Input size: ${pcmBuffer.length} bytes`);
    try {
        // Escrever o buffer PCM em um arquivo temporário
        fs.writeFileSync(inputPath, pcmBuffer);
        // Executar FFmpeg para converter PCM raw para MP3
        // O Gemini TTS retorna: PCM 24kHz, 16-bit little-endian, mono
        await new Promise((resolve, reject) => {
            const ffmpeg = (0, child_process_1.spawn)('ffmpeg', [
                '-y', // Sobrescrever arquivo de saída
                '-f', 's16le', // Formato de entrada: PCM signed 16-bit little-endian
                '-ar', '24000', // Sample rate de entrada: 24kHz
                '-ac', '1', // Canais de entrada: mono
                '-i', inputPath, // Arquivo de entrada
                '-codec:a', 'libmp3lame', // Codec MP3
                '-b:a', '192k', // Bitrate
                outputPath // Arquivo de saída
            ]);
            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Conversão para MP3 concluída');
                    resolve();
                }
                else {
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
    }
    finally {
        // Limpar arquivos temporários
        try {
            if (fs.existsSync(inputPath))
                fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath))
                fs.unlinkSync(outputPath);
        }
        catch (e) {
            // Ignorar erros de limpeza
        }
    }
}
/**
 * Verifica se o FFmpeg está instalado e disponível
 */
async function checkFfmpegInstalled() {
    return new Promise((resolve) => {
        const ffmpeg = (0, child_process_1.spawn)('ffmpeg', ['-version']);
        ffmpeg.on('close', (code) => {
            resolve(code === 0);
        });
        ffmpeg.on('error', () => {
            resolve(false);
        });
    });
}
