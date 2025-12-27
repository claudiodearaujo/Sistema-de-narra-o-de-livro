import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Redis - opcional
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let connection: IORedis | null = null;
let narrationQueue: Queue | null = null;

if (REDIS_ENABLED) {
    try {
        connection = new IORedis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('⚠️  Redis não disponível. Funcionalidades de fila desabilitadas.');
                    return null;
                }
                return Math.min(times * 100, 3000);
            }
        });

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
