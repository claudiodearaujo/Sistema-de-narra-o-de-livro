"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStoryCleanupWorker = startStoryCleanupWorker;
exports.stopStoryCleanupWorker = stopStoryCleanupWorker;
/**
 * Story Expiration Worker
 * Cleans up expired stories every hour
 */
const story_service_1 = require("../services/story.service");
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let cleanupInterval = null;
/**
 * Start the story cleanup worker
 */
function startStoryCleanupWorker() {
    if (cleanupInterval) {
        console.log('⚠️ Story cleanup worker is already running');
        return;
    }
    console.log('🧹 Story cleanup worker started (every 1 hour)');
    // Run cleanup immediately on start
    runCleanup();
    // Schedule periodic cleanup
    cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}
/**
 * Stop the story cleanup worker
 */
function stopStoryCleanupWorker() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('🛑 Story cleanup worker stopped');
    }
}
/**
 * Run the cleanup process
 */
async function runCleanup() {
    try {
        const deletedCount = await story_service_1.storyService.cleanupExpiredStories();
        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} expired stories`);
        }
    }
    catch (error) {
        console.error('❌ Error cleaning up expired stories:', error);
    }
}
// Auto-start if this module is imported directly
if (process.env.NODE_ENV !== 'test') {
    startStoryCleanupWorker();
}
