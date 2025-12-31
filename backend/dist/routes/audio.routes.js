"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioRoutes = void 0;
const express_1 = require("express");
const audio_controller_1 = require("../controllers/audio.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Process audio - requires auth, writer role, and TTS feature
router.post('/chapters/:chapterId/audio/process', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_1.requireFeature)('canUseTTS'), audio_controller_1.audioController.processAudio);
// Get audio status - requires auth only
router.get('/chapters/:chapterId/audio/status', middleware_1.authenticate, audio_controller_1.audioController.getStatus);
exports.audioRoutes = router;
