import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import * as profileController from '../controllers/profile.controller';

const router = Router();

/**
 * Profile Routes
 * Base path: /api/users
 */

// Get current user's profile (must be authenticated)
router.get('/me', authenticate, profileController.getMyProfile);

// Update current user's profile
router.put('/profile', authenticate, profileController.updateProfile);

// Get user profile by ID
router.get('/id/:userId', optionalAuth, profileController.getProfileById);

// Get user profile by username
router.get('/:username', optionalAuth, profileController.getProfile);

// Get user posts by username
router.get('/:username/posts', optionalAuth, profileController.getUserPosts);

// Get user books by username
router.get('/:username/books', optionalAuth, profileController.getUserBooks);

export default router;
