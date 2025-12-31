import { Router } from 'express';
import { likeController } from '../controllers/like.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

/**
 * Like Routes
 * Base path: /api/posts/:postId/like
 * 
 * These routes are nested under posts for semantic clarity
 */

// Toggle like on a post (authenticated)
router.post('/:postId/like', authenticate, likeController.toggleLike);

// Get users who liked a post (public)
router.get('/:postId/likes', optionalAuth, likeController.getLikes);

// Check if current user liked the post (authenticated)
router.get('/:postId/like/status', authenticate, likeController.getLikeStatus);

export default router;
