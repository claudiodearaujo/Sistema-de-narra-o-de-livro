"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const like_controller_1 = require("../controllers/like.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * Like Routes
 * Base path: /api/posts/:postId/like
 *
 * These routes are nested under posts for semantic clarity
 */
// Toggle like on a post (authenticated)
router.post('/:postId/like', middleware_1.authenticate, like_controller_1.likeController.toggleLike);
// Get users who liked a post (public)
router.get('/:postId/likes', middleware_1.optionalAuth, like_controller_1.likeController.getLikes);
// Check if current user liked the post (authenticated)
router.get('/:postId/like/status', middleware_1.authenticate, like_controller_1.likeController.getLikeStatus);
exports.default = router;
