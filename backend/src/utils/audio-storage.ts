import * as fs from 'fs';
import * as path from 'path';

const AUDIO_DIR = path.join(__dirname, '../../uploads/audio');

/**
 * Ensure uploads/audio directory exists.
 */
function ensureAudioDir(): void {
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
}

/**
 * Persist audio buffer to uploads/audio and return public URL.
 */
export function saveSpeechAudioFile(buffer: Buffer, speechId: string, format: string = 'mp3'): string {
    ensureAudioDir();

    const safeFormat = (format || 'mp3').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'mp3';
    const filename = `speech_${speechId}_${Date.now()}.${safeFormat}`;
    const filepath = path.join(AUDIO_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    return `/uploads/audio/${filename}`;
}

