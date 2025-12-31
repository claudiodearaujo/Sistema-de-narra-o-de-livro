import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getStoriesFeed,
  getStoriesByUser,
  getStoryById,
  createStory,
  viewStory,
  deleteStory,
  getStoryViewers,
  getMyStoriesCount,
} from '../controllers/story.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/stories - Get stories feed from followed users
router.get('/', getStoriesFeed);

// GET /api/stories/count - Get my active stories count and limits
router.get('/count', getMyStoriesCount);

// GET /api/stories/user/:userId - Get stories by specific user
router.get('/user/:userId', getStoriesByUser);

// GET /api/stories/:id - Get single story
router.get('/:id', getStoryById);

// POST /api/stories - Create a new story
router.post('/', createStory);

// POST /api/stories/:id/view - Mark story as viewed
router.post('/:id/view', viewStory);

// GET /api/stories/:id/viewers - Get story viewers (owner only)
router.get('/:id/viewers', getStoryViewers);

// DELETE /api/stories/:id - Delete a story
router.delete('/:id', deleteStory);

export default router;
