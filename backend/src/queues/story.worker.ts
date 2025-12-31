/**
 * Story Expiration Worker
 * Cleans up expired stories every hour
 */
import { storyService } from '../services/story.service';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the story cleanup worker
 */
export function startStoryCleanupWorker(): void {
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
export function stopStoryCleanupWorker(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('🛑 Story cleanup worker stopped');
  }
}

/**
 * Run the cleanup process
 */
async function runCleanup(): Promise<void> {
  try {
    const deletedCount = await storyService.cleanupExpiredStories();
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired stories`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired stories:', error);
  }
}

// Auto-start if this module is imported directly
if (process.env.NODE_ENV !== 'test') {
  startStoryCleanupWorker();
}
