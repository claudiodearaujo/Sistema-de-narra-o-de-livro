"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// Feed routes (authenticated)
router.get('/feed', middleware_1.authenticate, post_controller_1.postController.getFeed);
// Explore route (optional auth for personalized data)
router.get('/explore', middleware_1.optionalAuth, post_controller_1.postController.getExplore);
// Trending route (Sprint 7) - posts em alta das últimas 24h
router.get('/trending', middleware_1.optionalAuth, post_controller_1.postController.getTrending);
// Rebuild feed (authenticated)
router.post('/rebuild-feed', middleware_1.authenticate, post_controller_1.postController.rebuildFeed);
// Posts by user (optional auth)
router.get('/user/:userId', middleware_1.optionalAuth, post_controller_1.postController.getPostsByUser);
// CRUD routes
router.post('/', middleware_1.authenticate, post_controller_1.postController.createPost);
router.get('/:id', middleware_1.optionalAuth, post_controller_1.postController.getPostById);
router.delete('/:id', middleware_1.authenticate, post_controller_1.postController.deletePost);
// Share route (Sprint 7)
router.post('/:id/share', middleware_1.authenticate, post_controller_1.postController.sharePost);
// Stats route (Sprint 7)
router.get('/:id/stats', middleware_1.optionalAuth, post_controller_1.postController.getPostStats);
exports.default = router;
