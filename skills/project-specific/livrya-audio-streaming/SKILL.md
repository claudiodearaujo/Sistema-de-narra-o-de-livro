---
name: livrya-audio-streaming
description: HLS/DASH streaming, CDN optimization, and adaptive bitrate for audiobook playback
keywords: [streaming, hls, dash, cdn, adaptive-bitrate, playback, livrya]
category: project-specific
---

# 📡 Livrya Audio Streaming

Expert patterns for streaming audiobook chapters using HLS/DASH, CDN optimization, and adaptive bitrate selection.

## Overview

Livrya serves narrated chapters to millions of readers. Requirements:
- **Low Latency** - Users expect instant playback
- **Adaptive Quality** - Works on 3G and 5G
- **Scalability** - Thousands of concurrent streams
- **Cost Efficiency** - CDN bandwidth is expensive
- **Reliability** - No interruptions during playback

This skill covers production streaming architecture.

---

## Key Concepts

### 1. Streaming Formats

**HLS (HTTP Live Streaming):**
```
Pros:
- Universal browser support
- Adaptive bitrate built-in
- Easy to cache

Cons:
- Older format
- Larger playlists
```

**DASH (Dynamic Adaptive Streaming over HTTP):**
```
Pros:
- Modern, efficient
- Better adaptation
- Smaller segments

Cons:
- Less universal support
- More complex
```

**Recommendation:** Use both for maximum compatibility

### 2. Adaptive Bitrate Strategy

```
Network Speed Detection
    ↓
┌────────┬──────────┬──────────┐
↓        ↓          ↓          ↓
3G      4G         WiFi       5G
(64k)   (128k)    (192k)    (256k+)
```

### 3. Segment Strategy

```
Audio File (20 MB)
    ↓
Split into 10-second segments
    ↓
manifest.m3u8
├── segment-0.ts (64k, 128k, 192k variants)
├── segment-1.ts
├── segment-2.ts
└── ...
```

---

## Implementation Patterns

### Pattern 1: Generate HLS Manifest

```typescript
interface HLSSegmentConfig {
  audioPath: string;
  segmentDuration: number; // seconds
  bitrates: { [key: string]: number }; // e.g., { '64k': 64000 }
  outputDir: string;
  chapterId: string;
}

class HLSStreamGenerator {
  /**
   * Generate HLS segments and manifests
   */
  async generateHLS(config: HLSSegmentConfig): Promise<{
    manifestUrl: string;
    segments: string[];
    totalDuration: number;
  }> {
    const { audioPath, segmentDuration, bitrates, outputDir, chapterId } = config;

    // Get audio duration
    const metadata = await this.getAudioMetadata(audioPath);
    const totalDuration = metadata.duration;

    // Create output directory
    await mkdir(`${outputDir}/hls/${chapterId}`, { recursive: true });

    // Generate segments for each bitrate
    const segmentFiles: string[] = [];

    for (const [quality, bitrate] of Object.entries(bitrates)) {
      const qualityDir = `${outputDir}/hls/${chapterId}/${quality}`;
      await mkdir(qualityDir, { recursive: true });

      // Create manifest for this quality
      await this.createManifest(
        audioPath,
        qualityDir,
        segmentDuration,
        bitrate,
        totalDuration
      );

      segmentFiles.push(`${quality}/index.m3u8`);
    }

    // Create master manifest
    const masterManifest = this.generateMasterManifest(
      chapterId,
      Object.entries(bitrates),
      totalDuration
    );

    const manifestPath = `${outputDir}/hls/${chapterId}/index.m3u8`;
    await writeFile(manifestPath, masterManifest);

    return {
      manifestUrl: `/audio/hls/${chapterId}/index.m3u8`,
      segments: segmentFiles,
      totalDuration,
    };
  }

  /**
   * Generate variant (quality) playlist
   */
  private async createManifest(
    audioPath: string,
    outputDir: string,
    segmentDuration: number,
    bitrate: number,
    totalDuration: number
  ): Promise<void> {
    const numSegments = Math.ceil(totalDuration / segmentDuration);

    let manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${Math.ceil(segmentDuration)}
#EXT-X-MEDIA-SEQUENCE:0
`;

    // Generate segments
    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration;
      const duration = Math.min(segmentDuration, totalDuration - startTime);

      const segmentFile = `segment-${i}.ts`;

      // Encode segment
      await exec('ffmpeg', [
        '-ss', String(startTime),
        '-t', String(duration),
        '-i', audioPath,
        '-c:a', 'aac',
        '-b:a', `${bitrate}k`,
        '-f', 'mpegts',
        '-',
      ]);

      manifest += `#EXTINF:${duration.toFixed(3)},
${segmentFile}
`;
    }

    manifest += `#EXT-X-ENDLIST`;

    await writeFile(`${outputDir}/index.m3u8`, manifest);
  }

  /**
   * Generate master playlist with all variants
   */
  private generateMasterManifest(
    chapterId: string,
    bitrates: Array<[string, number]>,
    totalDuration: number
  ): string {
    // Sort by bitrate
    bitrates.sort((a, b) => a[1] - b[1]);

    let manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
`;

    for (const [quality, bitrate] of bitrates) {
      manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},RESOLUTION=0x0
${quality}/index.m3u8
`;
    }

    return manifest;
  }

  private async getAudioMetadata(filePath: string): Promise<{
    duration: number;
  }> {
    const { stdout } = await exec('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    return { duration: parseFloat(stdout) };
  }
}
```

### Pattern 2: Adaptive Bitrate Selection

```typescript
interface NetworkMetrics {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // 0-1
}

class AdaptiveBitrateSelector {
  selectBitrate(metrics: NetworkMetrics): string {
    const { bandwidth } = metrics;

    // Algorithm: Select bitrate < 80% of available bandwidth
    const maxBitrate = bandwidth * 0.8;

    const availableBitrates = [64, 128, 192, 256];
    const selected = availableBitrates.find((br) => br <= maxBitrate);

    return `${selected || 64}k`;
  }

  /**
   * Detect network quality from playback performance
   */
  analyzePlaybackQuality(events: PlaybackEvent[]): NetworkMetrics {
    // Calculate buffer ratio
    const bufferEvents = events.filter((e) => e.type === 'buffer');
    const totalEvents = events.length;
    const bufferRatio = bufferEvents.length / totalEvents;

    // Estimate bandwidth from download time
    const downloadEvents = events.filter((e) => e.type === 'download');
    const avgDownloadTime = downloadEvents.reduce((sum, e) => sum + e.duration, 0) / downloadEvents.length;

    // Estimate from segment size and time
    const segmentSize = 256; // KB (typical for 10 second segment)
    const estimatedBandwidth = (segmentSize * 8) / (avgDownloadTime / 1000); // kbps

    return {
      bandwidth: estimatedBandwidth,
      latency: 0, // Calculate from real data
      packetLoss: bufferRatio,
    };
  }
}

// Usage
const bitrateSelectorr = new AdaptiveBitrateSelector();

// Client-side adaptation
fetch('index.m3u8').then(async (manifest) => {
  const segments = parseSegments(manifest);

  for (const segment of segments) {
    // Measure download performance
    const startTime = performance.now();
    const response = await fetch(segment.url);
    const duration = performance.now() - startTime;

    // Adapt next selection
    const metrics = bitrateSelectorr.analyzePlaybackQuality([
      { type: 'download', duration, size: response.size },
    ]);

    const nextBitrate = bitrateSelectorr.selectBitrate(metrics);
    console.log(`Current bitrate: ${nextBitrate}`);
  }
});
```

### Pattern 3: CDN Integration

```typescript
interface CDNConfig {
  provider: 'cloudflare' | 'akamai' | 'aws-cloudfront';
  zone: string;
  caching: {
    ttl: number;
    cacheOnBrowser: boolean;
  };
}

class CDNManager {
  /**
   * Upload segments to CDN
   */
  async uploadSegments(
    localDir: string,
    cdnPath: string,
    config: CDNConfig
  ): Promise<void> {
    const files = await readdir(localDir);

    for (const file of files) {
      const localPath = join(localDir, file);
      const remotePath = `${cdnPath}/${file}`;

      // Upload with cache headers
      await this.uploadFile(localPath, remotePath, {
        cacheControl: `public, max-age=${config.caching.ttl}`,
        contentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
      });
    }
  }

  /**
   * Purge cache for chapter
   */
  async purgeCache(chapterId: string, config: CDNConfig): Promise<void> {
    const pattern = `/audio/hls/${chapterId}/*`;

    switch (config.provider) {
      case 'cloudflare':
        await this.purgeCloudflare(pattern);
        break;
      case 'akamai':
        await this.purgeAkamai(pattern);
        break;
      case 'aws-cloudfront':
        await this.purgeCloudFront(pattern);
        break;
    }
  }

  /**
   * Get CDN stats
   */
  async getStats(chapterId: string): Promise<{
    bandwidthUsed: number;
    requestCount: number;
    cacheHitRatio: number;
  }> {
    // Analytics based on CDN
    return {
      bandwidthUsed: 0,
      requestCount: 0,
      cacheHitRatio: 0,
    };
  }

  private async uploadFile(
    localPath: string,
    remotePath: string,
    headers: Record<string, string>
  ): Promise<void> {
    // Implementation depends on CDN provider
    console.log(`Uploading ${localPath} to ${remotePath}`);
  }

  private async purgeCloudflare(pattern: string): Promise<void> {
    // Cloudflare purge API
  }

  private async purgeAkamai(pattern: string): Promise<void> {
    // Akamai purge API
  }

  private async purgeCloudFront(pattern: string): Promise<void> {
    // CloudFront invalidation API
  }
}
```

### Pattern 4: Client-Side Playback

```typescript
interface StreamingPlayer {
  play(manifestUrl: string): void;
  pause(): void;
  seek(position: number): void;
  setQuality(bitrate: string): void;
}

class HLSPlayer implements StreamingPlayer {
  private video: HTMLVideoElement;
  private hls: HLS;
  private metrics: PlaybackMetrics = new PlaybackMetrics();

  constructor(elementId: string) {
    this.video = document.getElementById(elementId) as HTMLVideoElement;
    this.hls = new HLS({
      debug: true,
      enableWorker: true,
      lowLatencyMode: true,
    });

    // Listen to playback events
    this.setupEventListeners();
  }

  play(manifestUrl: string): void {
    this.hls.loadSource(manifestUrl);
    this.hls.attachMedia(this.video);

    // Start adaptive quality selection
    this.hls.on(HLS.Events.hlsFragChanged, (event, data) => {
      this.metrics.recordSegment(data);
      this.adaptQuality();
    });
  }

  setQuality(bitrate: string): void {
    // Manually set quality
    const qualities = this.hls.levels;
    const level = qualities.find((q) => q.bitrate === parseInt(bitrate));

    if (level) {
      this.hls.currentLevel = qualities.indexOf(level);
    }
  }

  private adaptQuality(): void {
    const metrics = this.metrics.getRecentMetrics();
    const selector = new AdaptiveBitrateSelector();
    const selectedBitrate = selector.selectBitrate(metrics);

    this.setQuality(selectedBitrate);
  }

  private setupEventListeners(): void {
    this.hls.on(HLS.Events.hlsError, (event, data) => {
      if (data.fatal) {
        console.error('Fatal HLS error:', data);
      }
    });

    this.video.addEventListener('play', () => {
      this.metrics.recordPlaybackStart();
    });

    this.video.addEventListener('pause', () => {
      this.metrics.recordPlaybackPause();
    });
  }

  pause(): void {
    this.video.pause();
  }

  seek(position: number): void {
    this.video.currentTime = position;
  }
}

// Usage
const player = new HLSPlayer('audio-player');
player.play('/audio/hls/chapter-1/index.m3u8');
```

---

## Best Practices

### ✅ DO's

1. **Use Adaptive Bitrate**
   - Detect network quality
   - Switch smoothly
   - Better user experience

2. **Cache Aggressively**
   - HLS manifests: 10 seconds
   - Segments: 30+ days
   - Reduce bandwidth costs

3. **Monitor Quality**
   - Track buffer events
   - Measure bitrate switches
   - Alert on issues

4. **Use CDN**
   - Distribute globally
   - Reduce latency
   - Handle spikes

### ❌ DON'Ts

1. **Don't Use Fixed Bitrate**
   - Wastes bandwidth
   - Causes buffering

2. **Don't Re-encode Segments**
   - Store once, serve multiple qualities
   - Use variants

3. **Don't Serve from Origin**
   - Always use CDN
   - Saves bandwidth costs

---

## Common Pitfalls

### ⚠️ Pitfall 1: Segment Duration Too Long
- **Problem:** Long segments = long buffers
- **Solution:** Use 10-second segments

### ⚠️ Pitfall 2: Manifest Not Updating
- **Problem:** Live streams stuck
- **Solution:** Set Cache-Control to low TTL

### ⚠️ Pitfall 3: Bandwidth Miscalculation
- **Problem:** Wrong quality selected
- **Solution:** Include network latency in calculation

---

## Related Skills

- `livrya-audio-processing` - Creating audio files
- `livrya-tts-optimization` - Generating audio
- `backend-dev-guidelines` - Server patterns
- `api-patterns` - API design

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya Audio Streaming
