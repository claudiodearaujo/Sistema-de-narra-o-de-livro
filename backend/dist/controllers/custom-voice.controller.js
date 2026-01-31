"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customVoiceController = exports.CustomVoiceController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class CustomVoiceController {
    // Listar todas as vozes customizadas ativas
    async list(req, res) {
        try {
            const voices = await prisma_1.default.customVoice.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });
            res.json(voices);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Criar nova voz customizada
    async create(req, res) {
        try {
            const { name, gender, languageCode, description, voiceId } = req.body;
            // Validações
            if (!name || !gender || !languageCode || !voiceId) {
                return res.status(400).json({
                    error: 'Campos obrigatórios: name, gender, languageCode, voiceId'
                });
            }
            // Verificar se já existe uma voz com esse nome
            const existing = await prisma_1.default.customVoice.findUnique({
                where: { name }
            });
            if (existing) {
                return res.status(400).json({
                    error: 'Já existe uma voz com este nome'
                });
            }
            const voice = await prisma_1.default.customVoice.create({
                data: {
                    name,
                    gender: gender.toUpperCase(),
                    languageCode,
                    description,
                    voiceId,
                    provider: 'custom'
                }
            });
            res.status(201).json(voice);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Buscar voz por ID
    async getById(req, res) {
        try {
            const id = req.params.id;
            const voice = await prisma_1.default.customVoice.findUnique({
                where: { id }
            });
            if (!voice) {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.json(voice);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Atualizar voz
    async update(req, res) {
        try {
            const id = req.params.id;
            const { name, gender, languageCode, description, voiceId, isActive } = req.body;
            const voice = await prisma_1.default.customVoice.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(gender && { gender: gender.toUpperCase() }),
                    ...(languageCode && { languageCode }),
                    ...(description !== undefined && { description }),
                    ...(voiceId && { voiceId }),
                    ...(isActive !== undefined && { isActive })
                }
            });
            res.json(voice);
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }
    // Deletar voz (soft delete - apenas desativa)
    async delete(req, res) {
        try {
            const id = req.params.id;
            const voice = await prisma_1.default.customVoice.update({
                where: { id },
                data: { isActive: false }
            });
            res.json({ message: 'Voz desativada com sucesso', voice });
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }
    // Deletar permanentemente
    async hardDelete(req, res) {
        try {
            const id = req.params.id;
            await prisma_1.default.customVoice.delete({
                where: { id }
            });
            res.json({ message: 'Voz deletada permanentemente' });
        }
        catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }
}
exports.CustomVoiceController = CustomVoiceController;
exports.customVoiceController = new CustomVoiceController();
