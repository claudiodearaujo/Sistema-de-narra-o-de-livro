import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { audioProcessorService } from '../services/audio-processor.service';
import { googleDriveService } from '../services/google-drive.service';
import path from 'path';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();

// Configuração do Redis - opcional
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let audioQueue: Queue | null = null;
let audioWorker: Worker | null = null;

export const AUDIO_JOB_NAME = 'process-audio';

if (REDIS_ENABLED) {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
} else {
    console.log('ℹ️  Redis desabilitado - Audio queue não inicializada');
}

export { audioQueue, audioWorker };
