"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voices_controller_1 = require("../controllers/voices.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// List voices - public route with optional auth
router.get('/voices', middleware_1.optionalAuth, voices_controller_1.voicesController.listVoices);
// Preview voice - requires auth, writer role, and TTS feature
router.post('/voices/preview', middleware_1.authenticate, middleware_1.requireWriter, (0, middleware_1.requireFeature)('canUseTTS'), voices_controller_1.voicesController.previewVoice);
exports.default = router;
