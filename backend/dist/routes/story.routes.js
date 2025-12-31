"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const story_controller_1 = require("../controllers/story.controller");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// GET /api/stories - Get stories feed from followed users
router.get('/', story_controller_1.getStoriesFeed);
// GET /api/stories/count - Get my active stories count and limits
router.get('/count', story_controller_1.getMyStoriesCount);
// GET /api/stories/user/:userId - Get stories by specific user
router.get('/user/:userId', story_controller_1.getStoriesByUser);
// GET /api/stories/:id - Get single story
router.get('/:id', story_controller_1.getStoryById);
// POST /api/stories - Create a new story
router.post('/', story_controller_1.createStory);
// POST /api/stories/:id/view - Mark story as viewed
router.post('/:id/view', story_controller_1.viewStory);
// GET /api/stories/:id/viewers - Get story viewers (owner only)
router.get('/:id/viewers', story_controller_1.getStoryViewers);
// DELETE /api/stories/:id - Delete a story
router.delete('/:id', story_controller_1.deleteStory);
exports.default = router;
