import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { narrationQueue, NARRATION_JOB_NAME } from '../queues/narration.queue';
import { mediaBatchService } from '../services/media-batch.service';
import { audioQueue, AUDIO_JOB_NAME } from '../queues/audio.queue';
import { auditService } from '../services/audit.service';

export class BatchController {
    /**
     * POST /api/chapters/:id/batch/generate-audio
     * Starts batch audio generation for all speeches in a chapter
     */
    async generateAudioBatch(req: Request, res: Response) {
        try {
            const chapterId = req.params.id as string;
            const { forceRegenerate } = req.body;
            const userId = (req as any).user?.id;
            const userEmail = (req as any).user?.email;

            // Check if chapter exists
            const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
            if (!chapter) {
                return res.status(404).json({ error: 'Chapter not found' });
            }

            if (!narrationQueue) {
                return res.status(503).json({ error: 'Queue service unavaliable' });
            }

            // Check existing jobs
            const existingJobs = await narrationQueue.getJobs(['active', 'waiting', 'delayed']);
            const existingJob = existingJobs.find(job => job.data.chapterId === chapterId && job.name === NARRATION_JOB_NAME);

            if (existingJob) {
                return res.status(409).json({ error: 'Job already in progress', jobId: existingJob.id });
            }

            // Add job
            const job = await narrationQueue.add(NARRATION_JOB_NAME, { chapterId, forceRegenerate });

            // Audit
            if (userId) {
                auditService.log({
                    userId,
                    userEmail: userEmail || '',
                    action: 'AUDIO_GENERATE' as any,
                    category: 'AI' as any,
                    severity: 'MEDIUM' as any,
                    resource: 'Chapter',
                    resourceId: chapterId,
                    description: 'Batch audio generation started',
                    metadata: { chapterId, jobId: job.id }
                }).catch(console.error);
            }

            res.json({ success: true, message: 'Batch audio generation started', jobId: job.id });

        } catch (error: any) {
            console.error('[Batch] Error starting audio batch:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/chapters/:id/batch/generate-images
     * Starts batch image generation for all speeches in a chapter
     */
    async generateImageBatch(req: Request, res: Response) {
        try {
            const chapterId = req.params.id as string;
            const userId = (req as any).user?.id;
            const userEmail = (req as any).user?.email;

            // Check if chapter exists
            const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
            if (!chapter) {
                return res.status(404).json({ error: 'Chapter not found' });
            }

            // Use service
            const result = await mediaBatchService.startImageBatch(chapterId, userId, userEmail);

            res.json({ success: true, ...result });

        } catch (error: any) {
            console.error('[Batch] Error starting image batch:', error);
            const status = error.message.includes('em andamento') ? 409 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    /**
     * POST /api/chapters/:id/export
     * Concatenates all speech audios into a single chapter audio file
     */
    async exportChapter(req: Request, res: Response) {
        try {
            const chapterId = req.params.id as string;
            const userId = (req as any).user?.id;
            const userEmail = (req as any).user?.email;

            // Check if chapter exists and get speeches
            const chapter = await prisma.chapter.findUnique({ 
                where: { id: chapterId },
                include: { speeches: { orderBy: { orderIndex: 'asc' } } }
            });
            
            if (!chapter) {
                return res.status(404).json({ error: 'Chapter not found' });
            }

            const speechIds = chapter.speeches
                .filter(s => s.audioUrl) // Only speeches with audio
                .map(s => s.id);

            if (speechIds.length === 0) {
                return res.status(400).json({ error: 'No audio files found in this chapter to export.' });
            }

            if (!audioQueue) {
                return res.status(503).json({ error: 'Audio queue service unavailable' });
            }

            // Add export job
            const job = await audioQueue.add(AUDIO_JOB_NAME, { 
                chapterId, 
                speechIds 
            });

            // Audit
            if (userId) {
                auditService.log({
                    userId,
                    userEmail: userEmail || '',
                    action: 'NARRATION_COMPLETE' as any, // Closest action
                    category: 'NARRATION' as any,
                    severity: 'LOW' as any,
                    resource: 'Chapter',
                    resourceId: chapterId,
                    description: 'Chapter export started',
                    metadata: { chapterId, jobId: job.id, speechCount: speechIds.length }
                }).catch(console.error);
            }

            res.json({ success: true, message: 'Chapter export started', jobId: job.id });

        } catch (error: any) {
            console.error('[Batch] Error starting export:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export const batchController = new BatchController();
