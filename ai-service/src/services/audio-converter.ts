import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts raw PCM audio (from Gemini TTS) to MP3 using FFmpeg
 * Gemini TTS returns PCM 24kHz, 16-bit, mono
 */
export async function convertWavToMp3(pcmBuffer: Buffer): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const tempId = uuidv4();
    const inputPath = path.join(tempDir, `input_${tempId}.pcm`);
    const outputPath = path.join(tempDir, `output_${tempId}.mp3`);

    console.log('Converting PCM to MP3...');
    console.log(`   Input size: ${pcmBuffer.length} bytes`);

    try {
        fs.writeFileSync(inputPath, pcmBuffer);

        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-f', 's16le',
                '-ar', '24000',
                '-ac', '1',
                '-i', inputPath,
                '-codec:a', 'libmp3lame',
                '-b:a', '192k',
                outputPath
            ]);

            let stderr = '';

            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('MP3 conversion completed');
                    resolve();
                } else {
                    console.error('FFmpeg stderr:', stderr);
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (err) => {
                reject(new Error(`Error running FFmpeg: ${err.message}`));
            });
        });

        const mp3Buffer = fs.readFileSync(outputPath);
        console.log(`   Output size: ${mp3Buffer.length} bytes`);

        return mp3Buffer;
    } finally {
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Concatenates multiple audio files into one using FFmpeg
 */
export async function concatenateAudioFiles(audioBuffers: Buffer[], format: string = 'mp3'): Promise<Buffer> {
    if (audioBuffers.length === 0) {
        throw new Error('No audio buffers to concatenate');
    }

    if (audioBuffers.length === 1) {
        return audioBuffers[0];
    }

    const tempDir = os.tmpdir();
    const tempId = uuidv4();
    const listPath = path.join(tempDir, `list_${tempId}.txt`);
    const outputPath = path.join(tempDir, `output_${tempId}.${format}`);
    const inputPaths: string[] = [];

    try {
        // Write each audio buffer to a temp file
        for (let i = 0; i < audioBuffers.length; i++) {
            const inputPath = path.join(tempDir, `input_${tempId}_${i}.${format}`);
            fs.writeFileSync(inputPath, audioBuffers[i]);
            inputPaths.push(inputPath);
        }

        // Create FFmpeg concat list file
        const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
        fs.writeFileSync(listPath, listContent);

        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', listPath,
                '-c', 'copy',
                outputPath
            ]);

            let stderr = '';

            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    console.error('FFmpeg concat stderr:', stderr);
                    reject(new Error(`FFmpeg concat failed with code ${code}`));
                }
            });

            ffmpeg.on('error', (err) => {
                reject(new Error(`Error running FFmpeg: ${err.message}`));
            });
        });

        return fs.readFileSync(outputPath);
    } finally {
        try {
            if (fs.existsSync(listPath)) fs.unlinkSync(listPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            for (const p of inputPaths) {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Gets audio duration in milliseconds using FFprobe
 */
export async function getAudioDuration(audioBuffer: Buffer): Promise<number> {
    const tempDir = os.tmpdir();
    const tempId = uuidv4();
    const inputPath = path.join(tempDir, `duration_${tempId}.mp3`);

    try {
        fs.writeFileSync(inputPath, audioBuffer);

        return new Promise<number>((resolve, reject) => {
            const ffprobe = spawn('ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                inputPath
            ]);

            let stdout = '';
            let stderr = '';

            ffprobe.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            ffprobe.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    const durationSec = parseFloat(stdout.trim());
                    resolve(Math.round(durationSec * 1000));
                } else {
                    console.error('FFprobe stderr:', stderr);
                    reject(new Error(`FFprobe failed with code ${code}`));
                }
            });

            ffprobe.on('error', (err) => {
                reject(new Error(`Error running FFprobe: ${err.message}`));
            });
        });
    } finally {
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Checks if FFmpeg is installed and available
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        const ffmpeg = spawn('ffmpeg', ['-version']);

        ffmpeg.on('close', (code) => {
            resolve(code === 0);
        });

        ffmpeg.on('error', () => {
            resolve(false);
        });
    });
}
