"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const custom_voice_controller_1 = require("../controllers/custom-voice.controller");
const router = (0, express_1.Router)();
// Listar todas as vozes customizadas
router.get('/custom-voices', (req, res) => custom_voice_controller_1.customVoiceController.list(req, res));
// Criar nova voz
router.post('/custom-voices', (req, res) => custom_voice_controller_1.customVoiceController.create(req, res));
// Buscar voz por ID
router.get('/custom-voices/:id', (req, res) => custom_voice_controller_1.customVoiceController.getById(req, res));
// Atualizar voz
router.put('/custom-voices/:id', (req, res) => custom_voice_controller_1.customVoiceController.update(req, res));
// Desativar voz (soft delete)
router.delete('/custom-voices/:id', (req, res) => custom_voice_controller_1.customVoiceController.delete(req, res));
// Deletar permanentemente
router.delete('/custom-voices/:id/hard', (req, res) => custom_voice_controller_1.customVoiceController.hardDelete(req, res));
exports.default = router;
