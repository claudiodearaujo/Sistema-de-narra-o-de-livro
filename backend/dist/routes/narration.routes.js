"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrationRoutes = void 0;
const express_1 = require("express");
const narration_controller_1 = require("../controllers/narration.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// All narration routes require authentication, writer role, and TTS feature
router.post('/chapters/:chapterId/narration/start', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_1.requireFeature)('canUseTTS'), narration_controller_1.narrationController.startNarration);
router.get('/chapters/:chapterId/narration/status', middleware_1.authenticate, narration_controller_1.narrationController.getNarrationStatus);
router.post('/chapters/:chapterId/narration/cancel', middleware_1.authenticate, middleware_1.requireWriter, narration_controller_1.narrationController.cancelNarration);
exports.narrationRoutes = router;
