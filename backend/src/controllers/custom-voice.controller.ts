import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class CustomVoiceController {
    // Listar todas as vozes customizadas ativas
    async list(req: Request, res: Response) {
        try {
            const voices = await prisma.customVoice.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });
            res.json(voices);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Criar nova voz customizada
    async create(req: Request, res: Response) {
        try {
            const { name, gender, languageCode, description, voiceId } = req.body;

            // Validações
            if (!name || !gender || !languageCode || !voiceId) {
                return res.status(400).json({
                    error: 'Campos obrigatórios: name, gender, languageCode, voiceId'
                });
            }

            // Verificar se já existe uma voz com esse nome
            const existing = await prisma.customVoice.findUnique({
                where: { name }
            });

            if (existing) {
                return res.status(400).json({
                    error: 'Já existe uma voz com este nome'
                });
            }

            const voice = await prisma.customVoice.create({
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
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Buscar voz por ID
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const voice = await prisma.customVoice.findUnique({
                where: { id }
            });

            if (!voice) {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }

            res.json(voice);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Atualizar voz
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, gender, languageCode, description, voiceId, isActive } = req.body;

            const voice = await prisma.customVoice.update({
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
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    // Deletar voz (soft delete - apenas desativa)
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const voice = await prisma.customVoice.update({
                where: { id },
                data: { isActive: false }
            });

            res.json({ message: 'Voz desativada com sucesso', voice });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    // Deletar permanentemente
    async hardDelete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await prisma.customVoice.delete({
                where: { id }
            });

            res.json({ message: 'Voz deletada permanentemente' });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Voz não encontrada' });
            }
            res.status(500).json({ error: error.message });
        }
    }
}

export const customVoiceController = new CustomVoiceController();
