"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrationService = exports.NarrationService = void 0;
const narration_queue_1 = require("../queues/narration.queue");
const audit_service_1 = require("./audit.service");
class NarrationService {
    async startNarration(chapterId, userId, userEmail) {
        if (!narration_queue_1.narrationQueue) {
            throw new Error('Redis não está habilitado. Funcionalidade de fila não disponível.');
        }
        // Check if job already exists
        const existingJobs = await narration_queue_1.narrationQueue.getJobs(['active', 'waiting', 'delayed']);
        const existingJob = existingJobs.find(job => job.data.chapterId === chapterId);
        if (existingJob) {
            throw new Error('Narration generation already in progress for this chapter');
        }
        const job = await narration_queue_1.narrationQueue.add(narration_queue_1.NARRATION_JOB_NAME, { chapterId });
        // Audit log - narration started
        if (userId && userEmail) {
            audit_service_1.auditService.log({
                userId,
                userEmail,
                action: 'NARRATION_START',
                category: 'NARRATION',
                severity: 'MEDIUM',
                resource: 'Narration',
                resourceId: chapterId,
                description: `Geração de áudio iniciada para o capítulo`,
                metadata: { chapterId, jobId: job.id }
            }).catch(err => console.error('[AUDIT]', err));
        }
        return { message: 'Narration started', jobId: job.id };
    }
    async getNarrationStatus(chapterId) {
        if (!narration_queue_1.narrationQueue) {
            return { status: 'redis_disabled', message: 'Redis não está habilitado' };
        }
        const jobs = await narration_queue_1.narrationQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
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
    async cancelNarration(chapterId, userId, userEmail) {
        if (!narration_queue_1.narrationQueue) {
            throw new Error('Redis não está habilitado. Funcionalidade de fila não disponível.');
        }
        const jobs = await narration_queue_1.narrationQueue.getJobs(['active', 'waiting', 'delayed']);
        const job = jobs.find(j => j.data.chapterId === chapterId);
        if (job) {
            await job.remove();
            // Audit log - narration cancelled
            if (userId && userEmail) {
                audit_service_1.auditService.log({
                    userId,
                    userEmail,
                    action: 'NARRATION_CANCEL',
                    category: 'NARRATION',
                    severity: 'LOW',
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
exports.NarrationService = NarrationService;
exports.narrationService = new NarrationService();
