import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';

dotenv.config();

let mediaQueue: Queue | null = null;

export const MEDIA_JOB_NAME = 'generate-media-batch';

if (isRedisEnabled()) {
    try {
        const connection = new IORedis(getRedisConfig());

        connection.on('error', (err) => {
            console.warn('⚠️  Redis error (MediaQueue):', err.message);
        });

        mediaQueue = new Queue('media', { connection });
        console.log('✅ Media Queue initialized');
    } catch (error) {
        console.warn('⚠️  Failed to initialize Media Queue:', error);
    }
} else {
    console.log('ℹ️  Redis disabled - Media Queue not initialized');
}

export { mediaQueue };
