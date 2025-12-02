"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioController = exports.AudioController = void 0;
const audio_queue_1 = require("../queues/audio.queue");
class AudioController {
    async processAudio(req, res) {
        try {
            const { chapterId } = req.params;
            const job = await audio_queue_1.audioQueue.add(audio_queue_1.AUDIO_JOB_NAME, { chapterId });
            res.json({ message: 'Audio processing started', jobId: job.id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getStatus(req, res) {
        try {
            const { chapterId } = req.params;
            const jobs = await audio_queue_1.audioQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.AudioController = AudioController;
exports.audioController = new AudioController();
