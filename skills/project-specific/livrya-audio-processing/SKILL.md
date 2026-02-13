---
name: livrya-audio-processing
description: Audio processing patterns and FFmpeg optimization for Livrya narrator system
keywords: [audio, FFmpeg, processing, compression, normalization, narrator, livrya]
category: project-specific
---

# 🎵 Livrya Audio Processing

Expert patterns for processing, optimizing, and managing audio files in Livrya's narrator system using FFmpeg and Node.js.

## Overview

Livrya generates audiobooks by narrating text through Gemini TTS and other providers. The resulting audio files need to be:
- **Optimized** for different quality tiers (preview, standard, high)
- **Normalized** for consistent volume levels across chapters
- **Compressed** to reduce storage and bandwidth
- **Enhanced** with metadata and chapter markers
- **Validated** for quality and duration

This skill covers production-ready patterns used in Livrya's audio processing pipeline.

---

## Key Concepts

### 1. Audio Formats in Livrya

**Primary Formats:**
- **MP3** - Lossy, best compression ratio, widely compatible
- **AAC** - Lossy, better quality at same bitrate, Apple-friendly
- **OGG/Opus** - Lossy, excellent for speech, newer devices
- **WAV** - Lossless, for internal processing only

**Use Cases:**
```
Gemini TTS Output
       ↓
   WAV (temporary)
       ↓
  ┌─────┴─────┬─────────┬─────────┐
  ↓           ↓         ↓         ↓
 MP3          AAC      OGG      FLAC
(preview)   (standard)(mobile)  (archive)
```

### 2. Bitrate Tiers

| Tier | Bitrate | Quality | Use Case | Size |
|------|---------|---------|----------|------|
| **Preview** | 64 kbps | Low | Free preview (5 min) | ~40 KB/min |
| **Standard** | 128 kbps | Good | Default playback | ~80 KB/min |
| **Premium** | 192 kbps | High | High-end devices | ~120 KB/min |
| **Lossless** | 320 kbps+ | Lossless | Archive/Master | ~200+ KB/min |

### 3. Normalization Strategies

**LUFS (Loudness Units relative to Full Scale):**
- Podcast standard: -16 LUFS
- Audiobook standard: -18 LUFS
- Livrya target: **-16 LUFS**

**Why?** Ensures consistent volume across:
- Different narrators
- Different TTS providers
- User's device/headphones

### 4. Processing Pipeline

```
Input (TTS Output)
    ↓
1. Validation (duration, format, channels)
    ↓
2. Silence Trimming (remove leading/trailing silence)
    ↓
3. Normalization (to -16 LUFS)
    ↓
4. Compression (reduce file size)
    ↓
5. Quality Check (duration, bitrate verification)
    ↓
6. Format Variants (MP3, AAC, OGG)
    ↓
7. Storage (CDN or S3)
    ↓
Output (Ready for playback)
```

---

## Implementation Patterns

### Pattern 1: Basic Audio Processing Pipeline

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const exec = promisify(execFile);

interface AudioProcessingOptions {
  inputPath: string;
  outputPath: string;
  bitrate?: string; // e.g., "128k"
  format?: 'mp3' | 'aac' | 'ogg' | 'wav';
  normalize?: boolean;
  targetLUFS?: number;
}

async function processAudio(options: AudioProcessingOptions): Promise<void> {
  const {
    inputPath,
    outputPath,
    bitrate = '128k',
    format = 'mp3',
    normalize = true,
    targetLUFS = -16,
  } = options;

  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Build FFmpeg command
  let ffmpegArgs = [
    '-i', inputPath,
    '-codec:a', format === 'mp3' ? 'libmp3lame' : 'aac', // or libopus for ogg
    '-b:a', bitrate,
    '-y', // Overwrite output
  ];

  // Add normalization filter if needed
  if (normalize) {
    ffmpegArgs = [
      '-i', inputPath,
      '-af', `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`,
      '-codec:a', format === 'mp3' ? 'libmp3lame' : 'aac',
      '-b:a', bitrate,
      '-y',
    ];
  }

  ffmpegArgs.push(outputPath);

  try {
    await exec('ffmpeg', ffmpegArgs);
    console.log(`✓ Audio processed: ${outputPath}`);
  } catch (error) {
    console.error(`✗ FFmpeg error: ${error.message}`);
    throw error;
  }
}

// Usage
await processAudio({
  inputPath: '/tmp/narrator-chapter-1.wav',
  outputPath: '/tmp/chapter-1-standard.mp3',
  bitrate: '128k',
  normalize: true,
  targetLUFS: -16,
});
```

### Pattern 2: Get Audio Metadata

```typescript
async function getAudioMetadata(filePath: string): Promise<{
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
}> {
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
    bitrate: parseInt(format.bit_rate) || 0,
    sampleRate: parseInt(stream.sample_rate) || 0,
    channels: parseInt(stream.channels) || 1,
    codec: stream.codec_name || 'unknown',
  };
}

// Usage
const metadata = await getAudioMetadata('/tmp/chapter-1.mp3');
console.log(`Duration: ${metadata.duration}s, Bitrate: ${metadata.bitrate/1000}kbps`);
```

### Pattern 3: Trim Silence

```typescript
async function trimSilence(
  inputPath: string,
  outputPath: string,
  threshold: number = -40 // dB
): Promise<{ trimmedDuration: number }> {
  // First pass: detect silence using silencedetect filter
  const detectArgs = [
    '-i', inputPath,
    '-af', `silencedetect=n=${threshold}dB:d=0.1`,
    '-f', 'null',
    '-',
  ];

  const { stderr } = await exec('ffmpeg', detectArgs);

  // Parse silence detection output
  let start = 0;
  let end = 0;
  const lines = stderr.split('\n');

  for (const line of lines) {
    if (line.includes('silence_start:')) {
      start = parseFloat(line.split(':')[1]);
    }
    if (line.includes('silence_end:')) {
      end = parseFloat(line.split(':')[1]);
    }
  }

  // Second pass: trim detected silence
  const trimArgs = [
    '-i', inputPath,
    '-ss', String(start),
    '-to', String(end),
    '-codec', 'copy', // Copy without re-encoding
    '-y',
    outputPath,
  ];

  await exec('ffmpeg', trimArgs);

  return { trimmedDuration: end - start };
}

// Usage
await trimSilence(
  '/tmp/raw-narrator.wav',
  '/tmp/trimmed-narrator.wav',
  -40
);
```

### Pattern 4: Create Multiple Format Variants

```typescript
async function createFormatVariants(
  inputPath: string,
  outputDir: string,
  chapterId: string
): Promise<{
  preview: string;
  standard: string;
  premium: string;
}> {
  const variants = {
    preview: { bitrate: '64k', path: `${outputDir}/${chapterId}-preview.mp3` },
    standard: { bitrate: '128k', path: `${outputDir}/${chapterId}-standard.mp3` },
    premium: { bitrate: '192k', path: `${outputDir}/${chapterId}-premium.mp3` },
  };

  // Process in parallel
  const promises = Object.entries(variants).map(([name, config]) =>
    processAudio({
      inputPath,
      outputPath: config.path,
      bitrate: config.bitrate,
      normalize: true,
    }).catch(err => {
      console.error(`Failed to create ${name} variant:`, err);
      throw err;
    })
  );

  await Promise.all(promises);

  return {
    preview: variants.preview.path,
    standard: variants.standard.path,
    premium: variants.premium.path,
  };
}

// Usage
const paths = await createFormatVariants(
  '/tmp/narrator-output.wav',
  '/tmp/processed',
  'chapter-1'
);
// Returns: { preview: '...preview.mp3', standard: '...standard.mp3', premium: '...premium.mp3' }
```

### Pattern 5: Batch Processing with Queue

```typescript
import Bull from 'bullmq';
import { Redis } from 'ioredis';

const redis = new Redis();
const audioProcessingQueue = new Bull('audio-processing', { connection: redis });

// Define job processor
audioProcessingQueue.process(
  async (job: Bull.Job<{
    inputPath: string;
    bookId: string;
    chapterId: string;
  }>) => {
    const { inputPath, bookId, chapterId } = job.data;

    try {
      job.progress(10);

      // Validate input
      const metadata = await getAudioMetadata(inputPath);
      job.progress(20);

      // Trim silence
      const trimmedPath = `/tmp/${chapterId}-trimmed.wav`;
      await trimSilence(inputPath, trimmedPath);
      job.progress(40);

      // Create variants
      const outputDir = `/processed/${bookId}/${chapterId}`;
      const variants = await createFormatVariants(
        trimmedPath,
        outputDir,
        chapterId
      );
      job.progress(90);

      // Save to database
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          audioUrl: variants.standard,
          audioMetadata: {
            duration: metadata.duration,
            formats: variants,
          },
        },
      });

      job.progress(100);
      return { success: true, variants };
    } catch (error) {
      console.error('Audio processing failed:', error);
      throw error;
    }
  }
);

// Enqueue job
async function processChapterAudio(
  inputPath: string,
  bookId: string,
  chapterId: string
): Promise<string> {
  const job = await audioProcessingQueue.add(
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
```

---

## Best Practices

### ✅ DO's

1. **Always Normalize Audio**
   - Ensures consistent experience for users
   - Prevents volume surprises between chapters
   - Use -16 LUFS for audiobooks

2. **Use Appropriate Bitrates**
   - Preview: 64 kbps (saves bandwidth)
   - Standard: 128 kbps (quality/size balance)
   - Premium: 192 kbps (best quality)

3. **Trim Silence**
   - Removes dead air at start/end of recordings
   - Reduces file size
   - Improves user experience

4. **Validate Output**
   - Always verify file integrity after processing
   - Check duration matches expected
   - Validate bitrate is correct

5. **Use Batch Processing**
   - Process multiple chapters in parallel
   - Use queues for reliability
   - Monitor job progress

6. **Cache Processed Files**
   - Store processed variants
   - Avoid re-processing same content
   - Use CDN for distribution

### ❌ DON'Ts

1. **Don't Re-encode Unnecessarily**
   - Use `-codec copy` when possible
   - Saves CPU and time

2. **Don't Store Lossless for Distribution**
   - WAV/FLAC are for archiving
   - Use MP3/AAC/OGG for playback

3. **Don't Process Without Validation**
   - Verify input file exists
   - Check format is supported
   - Validate FFmpeg installation

4. **Don't Ignore Errors**
   - Set up retry logic
   - Log failures
   - Alert on persistent issues

5. **Don't Process Synchronously**
   - Use queues (BullMQ)
   - Don't block request handlers
   - Return job ID immediately

---

## Common Pitfalls

### ⚠️ Pitfall 1: FFmpeg Not Installed

**Problem:** `ENOENT: no such file or directory, spawn 'ffmpeg'`

**Solution:**
```bash
# Check if FFmpeg is installed
ffmpeg -version

# Install on Ubuntu/Debian
sudo apt-get install ffmpeg

# Install on macOS
brew install ffmpeg

# Install in Docker
RUN apt-get update && apt-get install -y ffmpeg
```

### ⚠️ Pitfall 2: Memory Issues with Large Files

**Problem:** Processing long audiobooks causes OOM

**Solution:**
```typescript
// Use streaming instead of loading entire file
// FFmpeg handles this automatically

// But limit concurrent jobs:
const queue = new Bull('audio-processing', {
  connection: redis,
  defaultJobOptions: { concurrency: 2 }, // Limit to 2 parallel jobs
});
```

### ⚠️ Pitfall 3: Incorrect LUFS Detection

**Problem:** `loudnorm` filter behaves unpredictably

**Solution:**
```typescript
// Use integrated loudness measurement first
// Then normalize to exact target

// Get current loudness
const detectArgs = [
  '-i', inputPath,
  '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
  '-f', 'null',
  '-',
];

const { stderr } = await exec('ffmpeg', detectArgs);
const measurements = JSON.parse(stderr.match(/\{[\s\S]*\}/)[0]);

console.log(`Current loudness: ${measurements.input_i} LUFS`);
```

### ⚠️ Pitfall 4: Losing Audio Quality

**Problem:** MP3 encoding produces artifacts

**Solution:**
```typescript
// Use quality flags for better encoding
const args = [
  '-i', inputPath,
  '-q:a', '4', // MP3 quality flag (0-9, lower is better)
  // OR
  '-b:a', '192k', // Specify bitrate explicitly
  outputPath,
];
```

### ⚠️ Pitfall 5: Timezone Issues in Timestamps

**Problem:** Duration calculations go wrong

**Solution:**
```typescript
// Always parse floats, not strings
const duration = Math.ceil(parseFloat(format.duration)); // ✓ Correct
const duration = parseInt(format.duration); // ✗ Wrong - truncates

// Account for processing time
const startTime = Date.now();
// ... process ...
const processingTime = Date.now() - startTime;
```

---

## Code Examples & Templates

See `/skills/project-specific/livrya-audio-processing/assets/` for:
- **FFmpeg command reference** - Common FFmpeg patterns
- **Processing script template** - Ready-to-use Node.js script
- **Queue configuration** - BullMQ setup example
- **Error handling** - Comprehensive error handling

---

## Related Skills

- `livrya-tts-optimization` - Caching TTS results
- `livrya-audio-streaming` - Serving audio with HLS/DASH
- `backend-dev-guidelines` - General Node.js patterns
- `postgres-best-practices` - Storing audio metadata
- `api-security-best-practices` - Protecting audio endpoints

---

## References

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFprobe Guide](https://ffmpeg.org/ffprobe.html)
- [Audio Normalization Guide](https://en.wikipedia.org/wiki/Audio_normalization)
- [LUFS Standard](https://en.wikipedia.org/wiki/LUFS)
- [MP3 Encoding Quality](https://wiki.hydrogenaud.io/index.php?title=Fraunhofer_FhG_encoder)
- [AAC Encoding Guide](https://wiki.hydrogenaud.io/index.php?title=AAC)

---

## Livrya-Specific Notes

### Integration with Narrator System

```typescript
// After TTS generation
const narrator = await prisma.narrator.findUnique({
  where: { id: narratorId },
  include: { book: true },
});

// Get raw TTS output
const ttsOutput = await geminiTTS.synthesize(text, narrator.voice);

// Process with audio-processing skill
const processedVariants = await createFormatVariants(
  ttsOutput.path,
  `/audio/${narrator.book.id}`,
  `chapter-${chapterNumber}`
);

// Save to database
await prisma.chapter.update({
  where: { id: chapterId },
  data: {
    audioUrl: processedVariants.standard,
    audioPreviewUrl: processedVariants.preview,
  },
});

// Notify user
io.to(`book:${narrator.book.id}`).emit('chapter:audio-ready', {
  chapterId,
  audioUrl: processedVariants.standard,
});
```

### Storage Strategy

```
/audio/
├── [BOOK_ID]/
│   ├── [CHAPTER_ID]-preview.mp3       (64 kbps, quick preview)
│   ├── [CHAPTER_ID]-standard.mp3      (128 kbps, default playback)
│   ├── [CHAPTER_ID]-premium.mp3       (192 kbps, premium tier)
│   └── [CHAPTER_ID]-master.wav        (Lossless, archival)
```

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya Audio Narrator System
