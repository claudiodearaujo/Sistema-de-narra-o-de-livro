import { Request, Response } from 'express';
import { audioQueue, AUDIO_JOB_NAME } from '../queues/audio.queue';

export class AudioController {
    async processAudio(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const job = await audioQueue.add(AUDIO_JOB_NAME, { chapterId });
            res.json({ message: 'Audio processing started', jobId: job.id });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getStatus(req: Request, res: Response) {
        try {
            const { chapterId } = req.params;
            const jobs = await audioQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
            const chapterJobs = jobs.filter(job => job.data.chapterId === chapterId);

            if (chapterJobs.length === 0) {
                return res.json({ status: 'idle' });
            }

            chapterJobs.sort((a, b) => parseInt(b.id || '0') - parseInt(a.id || '0'));
            const latestJob = chapterJobs[0];
            const state = await latestJob.getState();

            res.json({
                status: state,
                jobId: latestJob.id,
                result: latestJob.returnvalue,
                failedReason: latestJob.failedReason
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const audioController = new AudioController();
