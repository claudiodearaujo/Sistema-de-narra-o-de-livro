"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const speeches_controller_1 = require("../controllers/speeches.controller");
const router = (0, express_1.Router)();
// Chapter-related speech routes
router.get('/chapters/:chapterId/speeches', speeches_controller_1.speechesController.getByChapterId);
router.post('/chapters/:chapterId/speeches', speeches_controller_1.speechesController.create);
router.put('/chapters/:chapterId/speeches/reorder', speeches_controller_1.speechesController.reorder);
router.post('/chapters/:chapterId/speeches/bulk', speeches_controller_1.speechesController.bulkCreate);
// Speech-specific routes
router.get('/speeches/:id', speeches_controller_1.speechesController.getById);
router.put('/speeches/:id', speeches_controller_1.speechesController.update);
router.delete('/speeches/:id', speeches_controller_1.speechesController.delete);
// SSML validation
router.post('/ssml/validate', speeches_controller_1.speechesController.validateSSML);
exports.default = router;
