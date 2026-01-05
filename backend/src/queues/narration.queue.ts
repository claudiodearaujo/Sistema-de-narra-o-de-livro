import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { getRedisConfig, isRedisEnabled } from '../config/redis.config';

dotenv.config();

let connection: IORedis | null = null;
let narrationQueue: Queue | null = null;

if (isRedisEnabled()) {
    try {
        connection = new IORedis(getRedisConfig());

        connection.on('ready', () => {
            console.log('✅ Redis connected (Narration Queue)');
        });

        connection.on('error', (err) => {
            console.warn('⚠️  Redis error (Narration):', err.message);
        });

        connection.on('close', () => {
            console.warn('⚠️  Redis connection closed (Narration)');
        });

        narrationQueue = new Queue('narration', { connection });
        console.log('✅ Narration Queue initialized');
    } catch (error) {
        console.warn('⚠️  Failed to initialize Narration Queue:', error);
    }
} else {
    console.log('ℹ️  Redis desabilitado - Narration Queue não inicializada');
}

export { narrationQueue };
export const NARRATION_JOB_NAME = 'generate-narration';
