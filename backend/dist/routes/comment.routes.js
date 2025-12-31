"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * Comment Routes
 *
 * Post comments: /api/posts/:postId/comments
 * Comment operations: /api/comments/:id
 */
// ===== Post Comments Routes (nested under posts) =====
// Get comments for a post (public)
router.get('/posts/:postId/comments', middleware_1.optionalAuth, comment_controller_1.commentController.getComments);
// Create a comment on a post (authenticated)
router.post('/posts/:postId/comments', middleware_1.authenticate, comment_controller_1.commentController.createComment);
// ===== Comment Routes =====
// Get replies for a comment (public)
router.get('/comments/:id/replies', middleware_1.optionalAuth, comment_controller_1.commentController.getReplies);
// Update a comment (authenticated, owner only)
router.put('/comments/:id', middleware_1.authenticate, comment_controller_1.commentController.updateComment);
// Delete a comment (authenticated, owner or admin)
router.delete('/comments/:id', middleware_1.authenticate, comment_controller_1.commentController.deleteComment);
// Toggle like on a comment (authenticated)
router.post('/comments/:id/like', middleware_1.authenticate, comment_controller_1.commentController.toggleCommentLike);
exports.default = router;
