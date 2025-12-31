"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const speeches_controller_1 = require("../controllers/speeches.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Chapter-related speech routes
router.get('/chapters/:chapterId/speeches', middleware_1.optionalAuth, speeches_controller_1.speechesController.getByChapterId);
router.post('/chapters/:chapterId/speeches', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.create);
router.put('/chapters/:chapterId/speeches/reorder', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.reorder);
router.post('/chapters/:chapterId/speeches/bulk', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.bulkCreate);
// Speech-specific routes
router.get('/speeches/:id', middleware_1.optionalAuth, speeches_controller_1.speechesController.getById);
router.put('/speeches/:id', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.update);
router.delete('/speeches/:id', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.delete);
// SSML validation (protected - requires auth)
router.post('/ssml/validate', middleware_1.authenticate, speeches_controller_1.speechesController.validateSSML);
// AI assist tools (protected - requires writer role)
router.post('/speeches/tools/spell-check', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.spellCheck);
router.post('/speeches/tools/suggestions', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.suggestImprovements);
router.post('/speeches/tools/character-context', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.enrichWithCharacter);
router.post('/speeches/tools/emotion-image', middleware_1.authenticate, middleware_1.requireWriter, speeches_controller_1.speechesController.generateEmotionImage);
exports.default = router;
