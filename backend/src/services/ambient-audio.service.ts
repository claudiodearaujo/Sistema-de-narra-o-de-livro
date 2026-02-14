import * as fs from 'fs/promises';
import * as path from 'path';

export type AmbientEngine = 'curated_catalog';

export interface GenerateAmbientAudioParams {
  speechId: string;
  ambientType?: string;
  durationSeconds?: number;
}

export interface AmbientAudioGenerationResult {
  engine: AmbientEngine;
  ambientType: string;
  durationSeconds: number;
  relativeUrl: string;
}

/**
 * Serviço responsável por gerar e persistir arquivos de áudio ambiente.
 *
 * Engine atual: catálogo curado local (síntese procedural simples por tipo de ambiente).
 */
export class AmbientAudioService {
  private readonly uploadsRoot = path.join(__dirname, '../../uploads');
  private readonly ambientDir = path.join(this.uploadsRoot, 'ambient');

  async generateAndStore(params: GenerateAmbientAudioParams): Promise<AmbientAudioGenerationResult> {
    const ambientType = this.normalizeAmbientType(params.ambientType);
    const durationSeconds = this.clampDuration(params.durationSeconds ?? 20);

    await fs.mkdir(this.ambientDir, { recursive: true });

    const filename = `ambient_${ambientType}_${params.speechId}_${Date.now()}.wav`;
    const fullPath = path.join(this.ambientDir, filename);

    const wavBuffer = this.createCuratedAmbientWav({ ambientType, durationSeconds });
    await fs.writeFile(fullPath, wavBuffer);

    return {
      engine: 'curated_catalog',
      ambientType,
      durationSeconds,
      relativeUrl: `/uploads/ambient/${filename}`,
    };
  }

  private normalizeAmbientType(rawType?: string): string {
    const normalized = (rawType || 'nature').toLowerCase().trim();

    const supported = new Set(['nature', 'rain', 'city', 'wind', 'fireplace']);
    return supported.has(normalized) ? normalized : 'nature';
  }

  private clampDuration(value: number): number {
    if (!Number.isFinite(value)) {
      return 20;
    }

    return Math.min(120, Math.max(5, Math.round(value)));
  }

  private createCuratedAmbientWav(params: { ambientType: string; durationSeconds: number }): Buffer {
    const sampleRate = 22_050;
    const channels = 1;
    const bitsPerSample = 16;
    const totalSamples = sampleRate * params.durationSeconds;
    const pcm = Buffer.alloc(totalSamples * 2);

    for (let i = 0; i < totalSamples; i += 1) {
      const t = i / sampleRate;
      const sample = this.getSampleForAmbientType(params.ambientType, t);
      const clamped = Math.max(-1, Math.min(1, sample));
      pcm.writeInt16LE(Math.round(clamped * 32767), i * 2);
    }

    return this.wrapPcmAsWav(pcm, sampleRate, channels, bitsPerSample);
  }

  private getSampleForAmbientType(ambientType: string, t: number): number {
    // Catálogo curado em camadas sintéticas simples para cada categoria.
    switch (ambientType) {
      case 'rain':
        return this.layeredNoise(t, 0.16, 220, 0.012, 0.008);
      case 'city':
        return this.layeredNoise(t, 0.14, 180, 0.021, 0.006) + Math.sin(2 * Math.PI * 110 * t) * 0.02;
      case 'wind':
        return this.layeredNoise(t, 0.2, 140, 0.009, 0.01);
      case 'fireplace':
        return this.layeredNoise(t, 0.18, 260, 0.04, 0.02);
      case 'nature':
      default:
        return this.layeredNoise(t, 0.15, 160, 0.017, 0.01) + Math.sin(2 * Math.PI * 880 * t) * 0.01;
    }
  }

  private layeredNoise(t: number, baseGain: number, lfoFreq: number, flutterA: number, flutterB: number): number {
    const pseudoNoise =
      Math.sin(2 * Math.PI * (lfoFreq * t + Math.sin(t * 0.73) * 0.4)) * 0.5 +
      Math.sin(2 * Math.PI * ((lfoFreq * 0.37) * t + Math.cos(t * 0.41) * 0.2)) * 0.35 +
      Math.sin(2 * Math.PI * ((lfoFreq * 1.61) * t + Math.sin(t * 0.17) * 0.1)) * 0.15;

    const envelope = 0.75 + Math.sin(2 * Math.PI * flutterA * t) * 0.15 + Math.cos(2 * Math.PI * flutterB * t) * 0.1;

    return pseudoNoise * baseGain * envelope;
  }

  private wrapPcmAsWav(pcmData: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
    const headerSize = 44;
    const dataSize = pcmData.length;
    const fileSize = headerSize + dataSize;

    const buffer = Buffer.alloc(fileSize);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);

    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28);
    buffer.writeUInt16LE((channels * bitsPerSample) / 8, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    pcmData.copy(buffer, 44);

    return buffer;
  }
}

export const ambientAudioService = new AmbientAudioService();
