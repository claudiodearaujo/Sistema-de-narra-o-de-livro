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
            lazyConnect: true, // Não conecta automaticamente
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn('⚠️  Redis não disponível. Funcionalidades de fila desabilitadas.');
                    return null; // Para de tentar reconectar
                }
                return Math.min(times * 100, 3000);
            }
        });

        connection.on('error', (err) => {
            console.warn('⚠️  Redis error:', err.message);
        });

        narrationQueue = new Queue('narration', { connection });
        console.log('✅ Redis queue initialized');
    } catch (error) {
        console.warn('⚠️  Redis não disponível. Funcionalidades de fila desabilitadas.');
    }
} else {
    console.log('ℹ️  Redis desabilitado via configuração');
}

export { narrationQueue };
export const NARRATION_JOB_NAME = 'generate-narration';
