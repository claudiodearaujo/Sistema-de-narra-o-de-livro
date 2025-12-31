"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const achievement_controller_1 = require("../controllers/achievement.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/', auth_middleware_1.optionalAuth, achievement_controller_1.getAllAchievements);
router.get('/category/:category', auth_middleware_1.optionalAuth, achievement_controller_1.getAchievementsByCategory);
router.get('/user/:userId', achievement_controller_1.getUserAchievements);
// Authenticated routes
router.get('/me', auth_middleware_1.authenticate, achievement_controller_1.getMyAchievements);
router.get('/me/stats', auth_middleware_1.authenticate, achievement_controller_1.getMyAchievementStats);
router.post('/me/recheck', auth_middleware_1.authenticate, achievement_controller_1.recheckAchievements);
exports.default = router;
