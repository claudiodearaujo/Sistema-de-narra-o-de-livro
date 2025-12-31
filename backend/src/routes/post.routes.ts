import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

// Feed routes (authenticated)
router.get('/feed', authenticate, postController.getFeed);

// Explore route (optional auth for personalized data)
router.get('/explore', optionalAuth, postController.getExplore);

// Trending route (Sprint 7) - posts em alta das últimas 24h
router.get('/trending', optionalAuth, postController.getTrending);

// Rebuild feed (authenticated)
router.post('/rebuild-feed', authenticate, postController.rebuildFeed);

// Posts by user (optional auth)
router.get('/user/:userId', optionalAuth, postController.getPostsByUser);

// CRUD routes
router.post('/', authenticate, postController.createPost);
router.get('/:id', optionalAuth, postController.getPostById);
router.delete('/:id', authenticate, postController.deletePost);

// Share route (Sprint 7)
router.post('/:id/share', authenticate, postController.sharePost);

// Stats route (Sprint 7)
router.get('/:id/stats', optionalAuth, postController.getPostStats);

export default router;
