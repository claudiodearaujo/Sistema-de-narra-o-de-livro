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
exports.charactersController = exports.CharactersController = void 0;
const characters_service_1 = require("../services/characters.service");
const tts_service_1 = require("../tts/tts.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CharactersController {
    async getByBookId(req, res) {
        try {
            const { bookId } = req.params;
            console.log(`[Backend] Fetching characters for bookId: ${bookId}`);
            const characters = await characters_service_1.charactersService.getByBookId(bookId);
            console.log(`[Backend] Found ${characters.length} characters`);
            res.json(characters);
        }
        catch (error) {
            console.error('[Backend] Error fetching characters:', error);
            res.status(500).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            console.log('[Backend] Fetching all characters');
            const characters = await characters_service_1.charactersService.getAll();
            console.log(`[Backend] Found ${characters.length} characters`);
            res.json(characters);
        }
        catch (error) {
            console.error('[Backend] Error fetching all characters:', error);
            res.status(500).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const character = await characters_service_1.charactersService.getById(id);
            res.json(character);
        }
        catch (error) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    async create(req, res) {
        try {
            const { bookId } = req.params;
            const character = await characters_service_1.charactersService.create({ ...req.body, bookId });
            res.status(201).json(character);
        }
        catch (error) {
            if (error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const character = await characters_service_1.charactersService.update(id, req.body);
            res.json(character);
        }
        catch (error) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await characters_service_1.charactersService.delete(id);
            res.json(result);
        }
        catch (error) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    }
    /**
     * Gera e persiste o áudio de preview para um personagem
     * Se o áudio já existe, retorna o existente
     */
    async generatePreviewAudio(req, res) {
        try {
            const { id } = req.params;
            const { forceRegenerate } = req.body;
            // Buscar o personagem
            const character = await characters_service_1.charactersService.getById(id);
            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }
            // Se já tem áudio e não forçou regeneração, retorna o existente
            if (character.previewAudioUrl && !forceRegenerate) {
                const audioPath = path.join(__dirname, '../../uploads', character.previewAudioUrl);
                // Se o arquivo existe E é MP3, usar o cache
                // Se for WAV, forçar regeneração para MP3
                const isMP3 = character.previewAudioUrl.endsWith('.mp3');
                if (fs.existsSync(audioPath) && isMP3) {
                    console.log(`🔊 Usando áudio MP3 existente para personagem ${character.name}: ${character.previewAudioUrl}`);
                    const audioBuffer = fs.readFileSync(audioPath);
                    const audioBase64 = audioBuffer.toString('base64');
                    return res.json({
                        audioBase64,
                        format: 'mp3',
                        voiceId: character.voiceId,
                        audioUrl: character.previewAudioUrl,
                        cached: true
                    });
                }
                else if (fs.existsSync(audioPath) && !isMP3) {
                    // Arquivo WAV antigo existe, deletar para regenerar em MP3
                    console.log(`🔄 Arquivo WAV antigo encontrado, será regenerado em MP3: ${character.previewAudioUrl}`);
                    fs.unlinkSync(audioPath);
                }
            }
            // Gerar novo áudio
            const previewText = `Olá! Esta é uma prévia da voz do personagem ${character.name}. Como você está hoje?`;
            console.log(`🎤 Gerando preview para personagem ${character.name} com voz ${character.voiceId}`);
            const result = await tts_service_1.ttsService.previewVoice(character.voiceId, previewText);
            // Criar diretório de previews se não existir
            const previewsDir = path.join(__dirname, '../../uploads/previews');
            if (!fs.existsSync(previewsDir)) {
                fs.mkdirSync(previewsDir, { recursive: true });
            }
            // Salvar o arquivo de áudio
            const fileName = `preview_${character.id}_${Date.now()}.${result.format}`;
            const filePath = path.join(previewsDir, fileName);
            fs.writeFileSync(filePath, result.buffer);
            console.log(`💾 Áudio salvo em: ${filePath}`);
            // Atualizar o personagem com o caminho do áudio
            const relativeUrl = `previews/${fileName}`;
            await characters_service_1.charactersService.update(id, { previewAudioUrl: relativeUrl });
            // Retornar o áudio em base64
            const audioBase64 = result.buffer.toString('base64');
            res.json({
                audioBase64,
                format: result.format,
                voiceId: character.voiceId,
                audioUrl: relativeUrl,
                cached: false
            });
        }
        catch (error) {
            console.error('❌ Erro ao gerar preview do personagem:', error);
            res.status(500).json({ error: error.message });
        }
    }
    /**
     * Retorna o áudio de preview existente de um personagem
     */
    async getPreviewAudio(req, res) {
        try {
            const { id } = req.params;
            const character = await characters_service_1.charactersService.getById(id);
            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }
            if (!character.previewAudioUrl) {
                return res.status(404).json({ error: 'No preview audio available', hasAudio: false });
            }
            const audioPath = path.join(__dirname, '../../uploads', character.previewAudioUrl);
            if (!fs.existsSync(audioPath)) {
                // O arquivo foi deletado, limpar a referência
                await characters_service_1.charactersService.update(id, { previewAudioUrl: null });
                return res.status(404).json({ error: 'Audio file not found', hasAudio: false });
            }
            const audioBuffer = fs.readFileSync(audioPath);
            const audioBase64 = audioBuffer.toString('base64');
            // Detectar formato do arquivo existente
            const format = character.previewAudioUrl.endsWith('.mp3') ? 'mp3' : 'wav';
            res.json({
                audioBase64,
                format,
                voiceId: character.voiceId,
                audioUrl: character.previewAudioUrl,
                hasAudio: true
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar preview do personagem:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.CharactersController = CharactersController;
exports.charactersController = new CharactersController();
