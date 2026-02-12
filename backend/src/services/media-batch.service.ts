import { mediaQueue, MEDIA_JOB_NAME } from '../queues/media.queue';
import { Job } from 'bullmq';
import { auditService } from './audit.service';

export class MediaBatchService {
    async startImageBatch(chapterId: string, userId?: string, userEmail?: string) {
        if (!mediaQueue) {
            throw new Error('Redis não está habilitado. Funcionalidade de fila não disponível.');
        }

        // Check if job already exists
        const existingJobs = await mediaQueue.getJobs(['active', 'waiting', 'delayed']);
        const existingJob = existingJobs.find(job => job.data.chapterId === chapterId && job.name === MEDIA_JOB_NAME);

        if (existingJob) {
            throw new Error('Geração de imagens em lote já está em andamento para este capítulo');
        }

        const job = await mediaQueue.add(MEDIA_JOB_NAME, { chapterId });

        // Audit log
        if (userId && userEmail) {
            auditService.log({
                userId,
                userEmail,
                action: 'AI_IMAGE_GENERATE' as any,
                category: 'AI' as any,
                severity: 'MEDIUM' as any,
                resource: 'Chapter',
                resourceId: chapterId,
                description: `Geração de imagens em lote iniciada`,
                metadata: { chapterId, jobId: job.id }
            }).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Batch image generation started', jobId: job.id };
    }
}

export const mediaBatchService = new MediaBatchService();
