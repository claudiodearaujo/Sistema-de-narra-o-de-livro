import { Router } from 'express';
import { customVoiceController } from '../controllers/custom-voice.controller';

const router = Router();

// Listar todas as vozes customizadas
router.get('/custom-voices', (req, res) => customVoiceController.list(req, res));

// Criar nova voz
router.post('/custom-voices', (req, res) => customVoiceController.create(req, res));

// Buscar voz por ID
router.get('/custom-voices/:id', (req, res) => customVoiceController.getById(req, res));

// Atualizar voz
router.put('/custom-voices/:id', (req, res) => customVoiceController.update(req, res));

// Desativar voz (soft delete)
router.delete('/custom-voices/:id', (req, res) => customVoiceController.delete(req, res));

// Deletar permanentemente
router.delete('/custom-voices/:id/hard', (req, res) => customVoiceController.hardDelete(req, res));

export default router;
