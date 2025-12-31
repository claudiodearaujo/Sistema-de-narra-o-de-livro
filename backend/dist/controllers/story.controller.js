"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoriesFeed = getStoriesFeed;
exports.getStoriesByUser = getStoriesByUser;
exports.getStoryById = getStoryById;
exports.createStory = createStory;
exports.viewStory = viewStory;
exports.deleteStory = deleteStory;
exports.getStoryViewers = getStoryViewers;
exports.getMyStoriesCount = getMyStoriesCount;
const story_service_1 = require("../services/story.service");
/**
 * Get stories feed (from followed users)
 */
async function getStoriesFeed(req, res, next) {
    try {
        const userId = req.user.id;
        const stories = await story_service_1.storyService.getStoriesFeed(userId);
        res.json({ stories });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get stories by user
 */
async function getStoriesByUser(req, res, next) {
    try {
        const { userId } = req.params;
        const viewerId = req.user.id;
        const stories = await story_service_1.storyService.getStoriesByUser(userId, viewerId);
        res.json({ stories });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Get single story
 */
async function getStoryById(req, res, next) {
    try {
        const { id } = req.params;
        const viewerId = req.user.id;
        const story = await story_service_1.storyService.getById(id, viewerId);
        if (!story) {
            return res.status(404).json({ error: 'Story não encontrado ou expirado' });
        }
        res.json(story);
    }
    catch (error) {
        next(error);
    }
}
/**
 * Create a new story
 */
async function createStory(req, res, next) {
    try {
        const userId = req.user.id;
        const { type, content, mediaUrl, expiresInHours } = req.body;
        if (!type) {
            return res.status(400).json({ error: 'Tipo do story é obrigatório' });
        }
        const story = await story_service_1.storyService.create(userId, {
            type,
            content,
            mediaUrl,
            expiresInHours,
        });
        res.status(201).json(story);
    }
    catch (error) {
        if (error.message?.includes('limite')) {
            return res.status(429).json({ error: error.message });
        }
        next(error);
    }
}
/**
 * Mark story as viewed
 */
async function viewStory(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await story_service_1.storyService.markAsViewed(id, userId);
        res.json({ success: true });
    }
    catch (error) {
        if (error.message?.includes('não encontrado') || error.message?.includes('expirado')) {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}
/**
 * Delete a story
 */
async function deleteStory(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await story_service_1.storyService.delete(id, userId);
        res.json({ success: true, message: 'Story excluído com sucesso' });
    }
    catch (error) {
        if (error.message?.includes('não encontrado')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message?.includes('permissão')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}
/**
 * Get story viewers
 */
async function getStoryViewers(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const result = await story_service_1.storyService.getViewers(id, userId, page, limit);
        res.json(result);
    }
    catch (error) {
        if (error.message?.includes('não encontrado')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message?.includes('permissão')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}
/**
 * Get my active stories count
 */
async function getMyStoriesCount(req, res, next) {
    try {
        const userId = req.user.id;
        const { count, limit } = await story_service_1.storyService.getActiveStoriesCountWithLimit(userId);
        res.json({
            count,
            limit,
            remaining: Math.max(0, limit - count),
        });
    }
    catch (error) {
        next(error);
    }
}
