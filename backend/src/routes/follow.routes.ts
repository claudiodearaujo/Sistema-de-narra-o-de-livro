import { Router } from 'express';
import { followController } from '../controllers/follow.controller';
import { authenticate, optionalAuth } from '../middleware';

const router = Router();

/**
 * Follow Routes
 * Base path: /api/users
 */

// Get suggested users to follow (authenticated)
router.get('/suggestions', authenticate, followController.getSuggestions);

// Toggle follow on a user (authenticated)
router.post('/:userId/follow', authenticate, followController.toggleFollow);

// Get followers of a user (public, with optional auth for isFollowing)
router.get('/:userId/followers', optionalAuth, followController.getFollowers);

// Get users that a user is following (public, with optional auth for isFollowing)
router.get('/:userId/following', optionalAuth, followController.getFollowing);

// Get follow status between current user and target (authenticated)
router.get('/:userId/follow-status', authenticate, followController.getFollowStatus);

// Get follower and following counts (public)
router.get('/:userId/follow-counts', optionalAuth, followController.getFollowCounts);

export default router;
