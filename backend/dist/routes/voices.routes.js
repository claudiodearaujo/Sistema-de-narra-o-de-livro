"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voices_controller_1 = require("../controllers/voices.controller");
const router = (0, express_1.Router)();
router.get('/voices', voices_controller_1.voicesController.listVoices);
router.post('/voices/preview', voices_controller_1.voicesController.previewVoice);
exports.default = router;
