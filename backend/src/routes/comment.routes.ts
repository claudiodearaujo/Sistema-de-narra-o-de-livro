import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

/**
 * Comment Routes
 * 
 * Post comments: /api/posts/:postId/comments
 * Comment operations: /api/comments/:id
 */

// ===== Post Comments Routes (nested under posts) =====

// Get comments for a post (public)
router.get('/posts/:postId/comments', optionalAuth, commentController.getComments);

// Create a comment on a post (authenticated)
router.post('/posts/:postId/comments', authenticate, commentController.createComment);

// ===== Comment Routes =====

// Get replies for a comment (public)
router.get('/comments/:id/replies', optionalAuth, commentController.getReplies);

// Update a comment (authenticated, owner only)
router.put('/comments/:id', authenticate, commentController.updateComment);

// Delete a comment (authenticated, owner or admin)
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// Toggle like on a comment (authenticated)
router.post('/comments/:id/like', authenticate, commentController.toggleCommentLike);

export default router;
