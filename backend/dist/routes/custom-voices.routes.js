"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const custom_voice_controller_1 = require("../controllers/custom-voice.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Listar todas as vozes customizadas - public with optional auth
router.get('/custom-voices', middleware_1.optionalAuth, (req, res) => custom_voice_controller_1.customVoiceController.list(req, res));
// Criar nova voz - ADMIN only
router.post('/custom-voices', middleware_1.authenticate, middleware_1.requireAdmin, (req, res) => custom_voice_controller_1.customVoiceController.create(req, res));
// Buscar voz por ID - public with optional auth
router.get('/custom-voices/:id', middleware_1.optionalAuth, (req, res) => custom_voice_controller_1.customVoiceController.getById(req, res));
// Atualizar voz - ADMIN only
router.put('/custom-voices/:id', middleware_1.authenticate, middleware_1.requireAdmin, (req, res) => custom_voice_controller_1.customVoiceController.update(req, res));
// Desativar voz (soft delete) - ADMIN only
router.delete('/custom-voices/:id', middleware_1.authenticate, middleware_1.requireAdmin, (req, res) => custom_voice_controller_1.customVoiceController.delete(req, res));
// Deletar permanentemente - ADMIN only
router.delete('/custom-voices/:id/hard', middleware_1.authenticate, middleware_1.requireAdmin, (req, res) => custom_voice_controller_1.customVoiceController.hardDelete(req, res));
exports.default = router;
