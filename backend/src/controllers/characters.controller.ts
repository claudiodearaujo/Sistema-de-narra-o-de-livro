import { Request, Response } from 'express';
import { charactersService } from '../services/characters.service';
import { ttsService } from '../tts/tts.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class CharactersController {
    async getByBookId(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            console.log(`[Backend] Fetching characters for bookId: ${bookId}`);
            
            const characters = await charactersService.getByBookId(bookId);
            console.log(`[Backend] Found ${characters.length} characters`);
            
            res.json(characters);
        } catch (error: any) {
            console.error('[Backend] Error fetching characters:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            console.log('[Backend] Fetching all characters');
            const characters = await charactersService.getAll();
            console.log(`[Backend] Found ${characters.length} characters`);
            res.json(characters);
        } catch (error: any) {
            console.error('[Backend] Error fetching all characters:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const character = await charactersService.getById(id);
            res.json(character);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { bookId } = req.params;
            const character = await charactersService.create({ ...req.body, bookId });
            res.status(201).json(character);
        } catch (error: any) {
            if (error.message === 'Book not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const character = await charactersService.update(id, req.body);
            res.json(character);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message });
            }
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await charactersService.delete(id);
            res.json(result);
        } catch (error: any) {
            if (error.message === 'Character not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    /**
     * Gera e persiste o áudio de preview para um personagem
     * Se o áudio já existe, retorna o existente
     */
    async generatePreviewAudio(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { forceRegenerate } = req.body;
            
            // Buscar o personagem
            const character = await charactersService.getById(id);
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
                } else if (fs.existsSync(audioPath) && !isMP3) {
                    // Arquivo WAV antigo existe, deletar para regenerar em MP3
                    console.log(`🔄 Arquivo WAV antigo encontrado, será regenerado em MP3: ${character.previewAudioUrl}`);
                    fs.unlinkSync(audioPath);
                }
            }

            // Gerar novo áudio
            const previewText = `Olá! Esta é uma prévia da voz do personagem ${character.name}. Como você está hoje?`;
            
            console.log(`🎤 Gerando preview para personagem ${character.name} com voz ${character.voiceId}`);
            
            const result = await ttsService.previewVoice(character.voiceId, previewText);
            
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
            await charactersService.update(id, { previewAudioUrl: relativeUrl });
            
            // Retornar o áudio em base64
            const audioBase64 = result.buffer.toString('base64');
            
            res.json({
                audioBase64,
                format: result.format,
                voiceId: character.voiceId,
                audioUrl: relativeUrl,
                cached: false
            });
        } catch (error: any) {
            console.error('❌ Erro ao gerar preview do personagem:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Retorna o áudio de preview existente de um personagem
     */
    async getPreviewAudio(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const character = await charactersService.getById(id);
            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }

            if (!character.previewAudioUrl) {
                return res.status(404).json({ error: 'No preview audio available', hasAudio: false });
            }

            const audioPath = path.join(__dirname, '../../uploads', character.previewAudioUrl);
            
            if (!fs.existsSync(audioPath)) {
                // O arquivo foi deletado, limpar a referência
                await charactersService.update(id, { previewAudioUrl: null });
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
        } catch (error: any) {
            console.error('❌ Erro ao buscar preview do personagem:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const charactersController = new CharactersController();
