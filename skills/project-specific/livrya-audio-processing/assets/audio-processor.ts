/**
 * Livrya Audio Processor
 * Production-ready audio processing for narrator system
 *
 * Usage:
 *   const processor = new AudioProcessor(options);
 *   const result = await processor.processChapter(inputPath, bookId, chapterId);
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdir } from 'fs';
import { dirname } from 'path';
import Bull from 'bullmq';
import { Redis } from 'ioredis';

const exec = promisify(execFile);
const mkdirAsync = promisify(mkdir);

export interface AudioProcessorOptions {
  redisUrl?: string;
  outputDir: string;
  defaultBitrate?: string;
  targetLUFS?: number;
  maxConcurrentJobs?: number;
}

export interface ProcessingResult {
  preview: string;
  standard: string;
  premium: string;
  metadata: AudioMetadata;
}

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrates: {
    preview: number;
    standard: number;
    premium: number;
  };
}

export class AudioProcessor {
  private queue: Bull.Queue;
  private options: AudioProcessorOptions;

  constructor(options: AudioProcessorOptions) {
    this.options = {
      defaultBitrate: '128k',
      targetLUFS: -16,
      maxConcurrentJobs: 2,
      ...options,
    };

    // Initialize queue
    const redis = new Redis(this.options.redisUrl || 'redis://localhost:6379');
    this.queue = new Bull('audio-processing', { connection: redis });

    // Setup job processor
    this.setupProcessor();
  }

  private setupProcessor(): void {
    this.queue.process(
      this.options.maxConcurrentJobs,
      async (job: Bull.Job<ProcessingJob>) => {
        return this.handleProcessingJob(job);
      }
    );

    // Event handlers
    this.queue.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err.message);
    });

    this.queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });
  }

  /**
   * Add audio processing job to queue
   */
  async processChapterAudio(
    inputPath: string,
    bookId: string,
    chapterId: string
  ): Promise<string> {
    const job = await this.queue.add(
      {
        inputPath,
        bookId,
        chapterId,
      },
      {
        priority: 10,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      }
    );

    return job.id;
  }

  /**
   * Get job progress
   */
  async getProgress(jobId: string): Promise<number | null> {
    const job = await this.queue.getJob(jobId);
    return job?.progress() ?? null;
  }

  /**
   * Process audio synchronously (for immediate results)
   */
  async processSync(
    inputPath: string,
    bookId: string,
    chapterId: string
  ): Promise<ProcessingResult> {
    if (!existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const outputDir = `${this.options.outputDir}/${bookId}/${chapterId}`;
    await mkdirAsync(outputDir, { recursive: true });

    try {
      // Get metadata
      const metadata = await this.getMetadata(inputPath);

      // Trim silence
      const trimmedPath = `${outputDir}/${chapterId}-trimmed.wav`;
      await this.trimSilence(inputPath, trimmedPath);

      // Create variants
      const variants = await this.createVariants(trimmedPath, outputDir, chapterId);

      return {
        ...variants,
        metadata,
      };
    } catch (error) {
      console.error('Audio processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle job from queue
   */
  private async handleProcessingJob(
    job: Bull.Job<ProcessingJob>
  ): Promise<ProcessingResult> {
    const { inputPath, bookId, chapterId } = job.data;

    try {
      job.progress(10);

      if (!existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      const outputDir = `${this.options.outputDir}/${bookId}/${chapterId}`;
      await mkdirAsync(outputDir, { recursive: true });

      // Get metadata
      const metadata = await this.getMetadata(inputPath);
      job.progress(25);

      // Trim silence
      const trimmedPath = `${outputDir}/${chapterId}-trimmed.wav`;
      await this.trimSilence(inputPath, trimmedPath);
      job.progress(50);

      // Create variants
      const variants = await this.createVariants(trimmedPath, outputDir, chapterId);
      job.progress(90);

      // Cleanup temp files
      await this.cleanup(trimmedPath);
      job.progress(100);

      return { ...variants, metadata };
    } catch (error) {
      console.error(`Job ${job.id} error:`, error);
      throw error;
    }
  }

  /**
   * Get audio metadata
   */
  private async getMetadata(filePath: string): Promise<AudioMetadata> {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration,bit_rate',
      '-show_entries', 'stream=codec_name,sample_rate,channels',
      '-of', 'json',
      filePath,
    ];

    const { stdout } = await exec('ffprobe', args);
    const data = JSON.parse(stdout);

    const format = data.format || {};
    const stream = data.streams[0] || {};

    return {
      duration: Math.ceil(parseFloat(format.duration) || 0),
      sampleRate: parseInt(stream.sample_rate) || 44100,
      channels: parseInt(stream.channels) || 2,
      bitrates: {
        preview: 64000,
        standard: 128000,
        premium: 192000,
      },
    };
  }

  /**
   * Trim silence from audio
   */
  private async trimSilence(
    inputPath: string,
    outputPath: string,
    threshold: number = -40
  ): Promise<void> {
    const args = [
      '-i', inputPath,
      '-af', `silenceremove=1:0:${threshold}dB`,
      '-y',
      outputPath,
    ];

    await exec('ffmpeg', args);
  }

  /**
   * Create MP3 variants
   */
  private async createVariants(
    inputPath: string,
    outputDir: string,
    chapterId: string
  ): Promise<{ preview: string; standard: string; premium: string }> {
    const variants = {
      preview: { bitrate: '64k', path: `${outputDir}/${chapterId}-preview.mp3` },
      standard: { bitrate: '128k', path: `${outputDir}/${chapterId}-standard.mp3` },
      premium: { bitrate: '192k', path: `${outputDir}/${chapterId}-premium.mp3` },
    };

    const promises = Object.values(variants).map((config) =>
      this.encodeMP3(inputPath, config.path, config.bitrate)
    );

    await Promise.all(promises);

    return {
      preview: variants.preview.path,
      standard: variants.standard.path,
      premium: variants.premium.path,
    };
  }

  /**
   * Encode to MP3 with normalization
   */
  private async encodeMP3(
    inputPath: string,
    outputPath: string,
    bitrate: string
  ): Promise<void> {
    const args = [
      '-i', inputPath,
      '-af', `loudnorm=I=${this.options.targetLUFS}:TP=-1.5:LRA=11`,
      '-codec:a', 'libmp3lame',
      '-b:a', bitrate,
      '-metadata', 'title=Livrya Audiobook',
      '-y',
      outputPath,
    ];

    await exec('ffmpeg', args);
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(filePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Cleanup failed for ${filePath}:`, error);
    }
  }

  /**
   * Verify file integrity
   */
  async verify(filePath: string): Promise<boolean> {
    try {
      const args = ['-v', 'error', '-i', filePath, '-f', 'null', '-'];
      await exec('ffmpeg', args);
      return true;
    } catch (error) {
      console.error(`File verification failed:`, error);
      return false;
    }
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    await this.queue.close();
  }
}

// Types
interface ProcessingJob {
  inputPath: string;
  bookId: string;
  chapterId: string;
}

// Example usage
export async function exampleUsage() {
  const processor = new AudioProcessor({
    outputDir: '/tmp/livrya-audio',
    targetLUFS: -16,
    maxConcurrentJobs: 2,
  });

  try {
    // Async processing (queue-based)
    const jobId = await processor.processChapterAudio(
      '/tmp/narrator-output.wav',
      'book-123',
      'chapter-1'
    );
    console.log(`Job started: ${jobId}`);

    // OR sync processing (immediate result)
    const result = await processor.processSync(
      '/tmp/narrator-output.wav',
      'book-123',
      'chapter-1'
    );
    console.log('Processing complete:', result);

    // Verify output
    const isValid = await processor.verify(result.standard);
    console.log(`Audio valid: ${isValid}`);

  } finally {
    await processor.close();
  }
}
