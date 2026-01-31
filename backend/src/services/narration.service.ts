import { narrationQueue, NARRATION_JOB_NAME } from '../queues/narration.queue';
import { Job } from 'bullmq';
import { auditService } from './audit.service';

export class NarrationService {
    async startNarration(chapterId: string, userId?: string, userEmail?: string) {
        if (!narrationQueue) {
            throw new Error('Redis não está habilitado. Funcionalidade de fila não disponível.');
        }

        // Check if job already exists
        const existingJobs = await narrationQueue.getJobs(['active', 'waiting', 'delayed']);
        const existingJob = existingJobs.find(job => job.data.chapterId === chapterId);

        if (existingJob) {
            throw new Error('Narration generation already in progress for this chapter');
        }

        const job = await narrationQueue.add(NARRATION_JOB_NAME, { chapterId });

        // Audit log - narration started
        if (userId && userEmail) {
            auditService.log({
                userId,
                userEmail,
                action: 'NARRATION_START' as any,
                category: 'NARRATION' as any,
                severity: 'MEDIUM' as any,
                resource: 'Narration',
                resourceId: chapterId,
                description: `Geração de áudio iniciada para o capítulo`,
                metadata: { chapterId, jobId: job.id }
            }).catch(err => console.error('[AUDIT]', err));
        }

        return { message: 'Narration started', jobId: job.id };
    }

    async getNarrationStatus(chapterId: string) {
        if (!narrationQueue) {
            return { status: 'redis_disabled', message: 'Redis não está habilitado' };
        }

        const jobs = await narrationQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
        // Filter jobs for this chapter and get the latest one
        const chapterJobs = jobs.filter(job => job.data.chapterId === chapterId);

        if (chapterJobs.length === 0) {
            return { status: 'idle' };
        }

        // Sort by timestamp desc
        chapterJobs.sort((a, b) => parseInt(b.id || '0') - parseInt(a.id || '0'));
        const latestJob = chapterJobs[0];
        const state = await latestJob.getState();

        return {
            status: state,
            jobId: latestJob.id,
            progress: latestJob.progress,
            failedReason: latestJob.failedReason
        };
    }

    async cancelNarration(chapterId: string, userId?: string, userEmail?: string) {
        if (!narrationQueue) {
            throw new Error('Redis não está habilitado. Funcionalidade de fila não disponível.');
        }

        const jobs = await narrationQueue.getJobs(['active', 'waiting', 'delayed']);
        const job = jobs.find(j => j.data.chapterId === chapterId);

        if (job) {
            await job.remove();

            // Audit log - narration cancelled
            if (userId && userEmail) {
                auditService.log({
                    userId,
                    userEmail,
                    action: 'NARRATION_CANCEL' as any,
                    category: 'NARRATION' as any,
                    severity: 'LOW' as any,
                    resource: 'Narration',
                    resourceId: chapterId,
                    description: `Geração de áudio cancelada`,
                    metadata: { chapterId, jobId: job.id }
                }).catch(err => console.error('[AUDIT]', err));
            }

            return { message: 'Narration cancelled' };
        }

        throw new Error('No active narration found for this chapter');
    }
}

export const narrationService = new NarrationService();
