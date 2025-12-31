import { Router } from 'express';
import { customVoiceController } from '../controllers/custom-voice.controller';
import { authenticate, optionalAuth, requireAdmin } from '../middleware';

const router = Router();

// Listar todas as vozes customizadas - public with optional auth
router.get('/custom-voices', optionalAuth, (req, res) => customVoiceController.list(req, res));

// Criar nova voz - ADMIN only
router.post('/custom-voices', authenticate, requireAdmin, (req, res) => customVoiceController.create(req, res));

// Buscar voz por ID - public with optional auth
router.get('/custom-voices/:id', optionalAuth, (req, res) => customVoiceController.getById(req, res));

// Atualizar voz - ADMIN only
router.put('/custom-voices/:id', authenticate, requireAdmin, (req, res) => customVoiceController.update(req, res));

// Desativar voz (soft delete) - ADMIN only
router.delete('/custom-voices/:id', authenticate, requireAdmin, (req, res) => customVoiceController.delete(req, res));

// Deletar permanentemente - ADMIN only
router.delete('/custom-voices/:id/hard', authenticate, requireAdmin, (req, res) => customVoiceController.hardDelete(req, res));

export default router;
