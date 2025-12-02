"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioRoutes = void 0;
const express_1 = require("express");
const audio_controller_1 = require("../controllers/audio.controller");
const router = (0, express_1.Router)();
router.post('/chapters/:chapterId/audio/process', audio_controller_1.audioController.processAudio);
router.get('/chapters/:chapterId/audio/status', audio_controller_1.audioController.getStatus);
exports.audioRoutes = router;
