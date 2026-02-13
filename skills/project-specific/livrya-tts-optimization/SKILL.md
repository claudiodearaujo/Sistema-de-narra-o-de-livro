---
name: livrya-tts-optimization
description: Optimization patterns for Gemini TTS with caching, fallback strategies, and cost management
keywords: [tts, gemini, caching, fallback, optimization, narrator, voice, livrya]
category: project-specific
---

# 🎙️ Livrya TTS Optimization

Expert patterns for optimizing Gemini TTS integration in Livrya, covering caching, fallback strategies, voice selection, and cost management.

## Overview

Livrya integrates Google Gemini Text-to-Speech to narrate book chapters. TTS API calls are:
- **Expensive** - Cost per request
- **Slow** - Takes 10-30 seconds per chapter
- **Unreliable** - May timeout or fail
- **Latency-sensitive** - Users expect quick narration

This skill covers production patterns to optimize TTS performance and cost.

---

## Key Concepts

### 1. TTS Cost Model

**Gemini API Pricing (approximate):**
```
- Input: ~$0.00002 per character
- Output: ~$0.001 per minute of audio
- For a 5,000 word chapter:
  * ~25,000 characters
  * ~20-30 minutes audio
  * Cost: $0.05 - $0.10 per chapter
```

**Cost Optimization:**
```
1 Chapter × 50 reads = $2.50 - $5.00
1 Book × 20 chapters × 50 reads = $50 - $100

→ Caching saves 90% of costs
→ Fallback avoids failed retries
```

### 2. Voice Selection Strategy

**Personas in Livrya:**
```
Narrator Persona    | Voice Characteristics  | Best For
─────────────────────────────────────────────────────────
Standard           | Neutral, clear         | Fiction, narrative
Professional       | Formal, authoritative  | Non-fiction, essays
Casual             | Friendly, conversational | Informal, dialogue
Character-Based    | Distinct per character | Drama, multi-voice
```

### 3. Caching Layers

```
Request
    ↓
1. In-Memory Cache (Node.js memory)
    ↓ (miss)
2. Redis Cache (TTL: 30 days)
    ↓ (miss)
3. S3/CDN Cache (Persistent storage)
    ↓ (miss)
4. Gemini TTS API (Generate new audio)
    ↓ (success)
Update all caches
    ↓
Return to user
```

### 4. Fallback Strategy

```
Try Gemini (Preferred)
    ↓ (timeout/error)
Try ElevenLabs (Alternative)
    ↓ (timeout/error)
Try Cached Version (Degraded)
    ↓ (not available)
Return Error (Alert team)
```

---

## Implementation Patterns

### Pattern 1: Redis-Backed TTS Cache

```typescript
import { Redis } from 'ioredis';
import crypto from 'crypto';

interface TTSRequest {
  text: string;
  voice: string;
  languageCode?: string;
}

interface TTSCache {
  audioBuffer: Buffer;
  mimeType: string;
  duration: number;
  createdAt: Date;
}

class TTSCacheService {
  private redis: Redis;
  private cacheTTL = 30 * 24 * 60 * 60; // 30 days

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(request: TTSRequest): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${request.text}:${request.voice}:${request.languageCode || 'en-US'}`)
      .digest('hex');
    return `tts:${hash}`;
  }

  /**
   * Get cached audio
   */
  async getFromCache(request: TTSRequest): Promise<TTSCache | null> {
    const key = this.generateCacheKey(request);
    const cached = await this.redis.getBuffer(key);

    if (!cached) return null;

    try {
      return JSON.parse(cached.toString());
    } catch {
      // Cache corrupted, remove it
      await this.redis.del(key);
      return null;
    }
  }

  /**
   * Store in cache
   */
  async saveToCache(
    request: TTSRequest,
    audio: Buffer,
    mimeType: string,
    duration: number
  ): Promise<void> {
    const key = this.generateCacheKey(request);
    const cacheData: TTSCache = {
      audioBuffer: audio,
      mimeType,
      duration,
      createdAt: new Date(),
    };

    // Store with TTL
    await this.redis.setex(
      key,
      this.cacheTTL,
      JSON.stringify({
        ...cacheData,
        audioBuffer: audio.toString('base64'),
      })
    );

    // Track in metrics
    console.log(`Cached TTS: ${key}`);
  }

  /**
   * Clear cache for specific voice
   */
  async clearVoiceCache(voice: string): Promise<number> {
    const pattern = `tts:*:${voice}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      return await this.redis.del(...keys);
    }
    return 0;
  }

  /**
   * Get cache stats
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    ttsCacheSize: string;
    hitRate: number;
  }> {
    const keys = await this.redis.keys('tts:*');
    const info = await this.redis.info('memory');

    return {
      totalKeys: keys.length,
      ttsCacheSize: info.split('\r\n')[1] || 'unknown',
      hitRate: 0, // Calculate from metrics
    };
  }
}

// Usage
const ttsCache = new TTSCacheService('redis://localhost:6379');

// Try cache first
let audio = await ttsCache.getFromCache({
  text: 'Chapter 1: The Beginning',
  voice: 'en-US-Neural2-A',
});

if (!audio) {
  // Generate with Gemini
  const audioBuffer = await geminiTTS.synthesize({
    text: 'Chapter 1: The Beginning',
    voice: 'en-US-Neural2-A',
  });

  // Cache for future use
  await ttsCache.saveToCache(
    { text: 'Chapter 1: The Beginning', voice: 'en-US-Neural2-A' },
    audioBuffer,
    'audio/mpeg',
    120
  );

  audio = audioBuffer;
}
```

### Pattern 2: Fallback with Graceful Degradation

```typescript
interface TTSProvider {
  synthesize(text: string, voice: string): Promise<Buffer>;
  name: string;
}

class TTSWithFallback {
  private providers: TTSProvider[];
  private logger: Logger;

  constructor(providers: TTSProvider[], logger: Logger) {
    this.providers = providers;
    this.logger = logger;
  }

  async synthesize(text: string, voice: string): Promise<{
    audio: Buffer;
    provider: string;
    isFallback: boolean;
  }> {
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];

      try {
        this.logger.info(`Attempting TTS with ${provider.name}`);

        const audio = await Promise.race([
          provider.synthesize(text, voice),
          this.timeout(30000), // 30 second timeout
        ]);

        this.logger.info(`✓ ${provider.name} succeeded`);

        return {
          audio,
          provider: provider.name,
          isFallback: i > 0, // Not primary provider
        };
      } catch (error) {
        const isLast = i === this.providers.length - 1;

        this.logger.warn(
          `✗ ${provider.name} failed: ${error.message}${isLast ? ' (LAST PROVIDER)' : ''}`
        );

        if (isLast) {
          throw new Error(
            `All TTS providers failed. Last error: ${error.message}`
          );
        }

        // Try next provider
        continue;
      }
    }

    throw new Error('No TTS providers available');
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TTS timeout')), ms)
    );
  }
}

// Setup with Gemini as primary, ElevenLabs as fallback
const ttsPipeline = new TTSWithFallback(
  [
    {
      name: 'Gemini',
      synthesize: async (text, voice) => {
        return await geminiClient.tts.synthesize(text, voice);
      },
    },
    {
      name: 'ElevenLabs',
      synthesize: async (text, voice) => {
        return await elevenLabsClient.tts.synthesize(text, voice);
      },
    },
    {
      name: 'Cached',
      synthesize: async (text, voice) => {
        const cached = await ttsCache.getFromCache({ text, voice });
        if (cached) return cached.audioBuffer;
        throw new Error('Not in cache');
      },
    },
  ],
  logger
);

// Usage
const result = await ttsPipeline.synthesize(
  'Chapter 1: The Beginning',
  'en-US-Neural2-A'
);
console.log(`Audio from: ${result.provider}, Fallback: ${result.isFallback}`);
```

### Pattern 3: Voice Selection Strategy

```typescript
interface NarratorVoice {
  providerId: string;
  languageCode: string;
  characteristics: string[];
  cost: number;
  quality: 'standard' | 'premium';
}

class VoiceSelector {
  private voices: Map<string, NarratorVoice> = new Map();

  registerVoice(voiceId: string, config: NarratorVoice): void {
    this.voices.set(voiceId, config);
  }

  /**
   * Select best voice for narrator
   */
  selectVoice(narrator: {
    preferredVoice?: string;
    personaType: 'standard' | 'professional' | 'casual' | 'character';
    language: string;
    budget: 'standard' | 'premium';
  }): string {
    // 1. Check preferred voice
    if (narrator.preferredVoice && this.voices.has(narrator.preferredVoice)) {
      return narrator.preferredVoice;
    }

    // 2. Find voice matching persona and budget
    const candidates = Array.from(this.voices.entries())
      .filter(([_, voice]) => {
        const matchesLanguage = voice.languageCode.startsWith(narrator.language);
        const matchesBudget = voice.quality === narrator.budget;
        const matchesPersona = voice.characteristics.includes(narrator.personaType);

        return matchesLanguage && matchesBudget && matchesPersona;
      });

    if (candidates.length === 0) {
      throw new Error(
        `No voice available for ${narrator.personaType} narrator in ${narrator.language}`
      );
    }

    // 3. Return best match (lowest cost among matches)
    candidates.sort((a, b) => a[1].cost - b[1].cost);
    return candidates[0][0];
  }
}

// Setup
const voiceSelector = new VoiceSelector();

voiceSelector.registerVoice('en-US-Neural2-A', {
  providerId: 'gemini',
  languageCode: 'en-US',
  characteristics: ['standard', 'neutral', 'clear'],
  cost: 0.001,
  quality: 'premium',
});

voiceSelector.registerVoice('en-US-Neural2-C', {
  providerId: 'gemini',
  languageCode: 'en-US',
  characteristics: ['professional', 'authoritative', 'formal'],
  cost: 0.001,
  quality: 'premium',
});

// Usage
const bestVoice = voiceSelector.selectVoice({
  personaType: 'professional',
  language: 'en-US',
  budget: 'premium',
});
```

### Pattern 4: Batch Processing with Cost Tracking

```typescript
interface TTSJobMetrics {
  chaptersProcessed: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
  failureRetries: number;
}

class TTSBatchProcessor {
  private metrics: TTSJobMetrics = {
    chaptersProcessed: 0,
    totalCost: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failureRetries: 0,
  };

  async processBatch(
    chapters: Array<{
      id: string;
      title: string;
      text: string;
      narrator: string;
    }>,
    options: {
      maxConcurrent?: number;
      stopOnError?: boolean;
    } = {}
  ): Promise<Map<string, Buffer>> {
    const { maxConcurrent = 3, stopOnError = false } = options;
    const results = new Map<string, Buffer>();

    // Process with concurrency limit
    let index = 0;
    const pending = new Set();

    while (index < chapters.length || pending.size > 0) {
      while (pending.size < maxConcurrent && index < chapters.length) {
        const chapter = chapters[index++];
        const promise = this.processChapter(chapter)
          .then((audio) => {
            results.set(chapter.id, audio);
            this.metrics.chaptersProcessed++;
          })
          .catch((error) => {
            if (stopOnError) throw error;
            console.error(`Failed to process chapter ${chapter.id}:`, error);
          })
          .finally(() => pending.delete(promise));

        pending.add(promise);
      }

      if (pending.size > 0) {
        await Promise.race(pending);
      }
    }

    return results;
  }

  private async processChapter(chapter: any): Promise<Buffer> {
    // Try cache first
    const cached = await ttsCache.getFromCache({
      text: chapter.text,
      voice: chapter.narrator,
    });

    if (cached) {
      this.metrics.cacheHits++;
      return cached.audioBuffer;
    }

    this.metrics.cacheMisses++;

    // Generate audio
    const audio = await ttsPipeline.synthesize(chapter.text, chapter.narrator);

    // Track cost
    const estimatedCost = (chapter.text.length * 0.00002) + 0.01;
    this.metrics.totalCost += estimatedCost;

    // Cache for future
    await ttsCache.saveToCache(
      { text: chapter.text, voice: chapter.narrator },
      audio.audio,
      'audio/mpeg',
      120
    );

    return audio.audio;
  }

  getMetrics(): TTSJobMetrics {
    return { ...this.metrics };
  }
}
```

---

## Best Practices

### ✅ DO's

1. **Always Cache Results**
   - Same text + voice = same audio
   - 90% cost savings

2. **Use Fallback Providers**
   - Gemini as primary
   - ElevenLabs as backup
   - Cached as last resort

3. **Set Timeouts**
   - 30 seconds per request
   - Fail fast, try fallback

4. **Monitor Costs**
   - Track API usage
   - Alert on anomalies
   - Optimize voice selection

5. **Batch Process**
   - Limit concurrent requests
   - Respect rate limits
   - Process in background queues

### ❌ DON'Ts

1. **Don't Re-process Identical Requests**
   - Always check cache first
   - Massive cost waste

2. **Don't Use Premium Tier Unnecessarily**
   - Standard works for most use cases
   - Reserve premium for important narrators

3. **Don't Block User Requests**
   - Queue TTS jobs
   - Return immediately
   - Process in background

4. **Don't Ignore Failures**
   - Log all errors
   - Implement fallback
   - Alert if all providers fail

---

## Common Pitfalls

### ⚠️ Pitfall 1: Cache Key Collisions

**Problem:** Different texts produce same cache key

**Solution:**
```typescript
// Include all relevant parameters in key
const key = crypto
  .createHash('sha256')
  .update(`${text}:${voice}:${languageCode}:${speed}:${pitch}`)
  .digest('hex');
```

### ⚠️ Pitfall 2: Stale Cache

**Problem:** Old narration doesn't match updated text

**Solution:**
```typescript
// Invalidate cache when text changes
await ttsCache.delete(oldTextHash);

// Or use versioning
const cacheKey = `tts:${textHash}:v${textVersion}`;
```

### ⚠️ Pitfall 3: Rate Limiting

**Problem:** Too many concurrent requests to Gemini

**Solution:**
```typescript
// Limit concurrency
const processor = new TTSBatchProcessor();
await processor.processBatch(chapters, {
  maxConcurrent: 2, // Adjust based on API limits
});
```

### ⚠️ Pitfall 4: Silent Failures

**Problem:** No logging, issues go unnoticed

**Solution:**
```typescript
// Always log
logger.error(`TTS failed: ${error.message}`, {
  text: chapter.text.slice(0, 100),
  narrator: chapter.narrator,
  provider: 'gemini',
  retryCount: retries,
});
```

---

## Code Examples & Templates

See `/skills/project-specific/livrya-tts-optimization/assets/` for:
- **tts-cache.ts** - Redis caching implementation
- **tts-providers.ts** - Multi-provider fallback
- **tts-monitor.ts** - Cost and performance monitoring
- **batch-processor.ts** - Batch processing with metrics

---

## Related Skills

- `livrya-audio-processing` - Post-processing of TTS audio
- `livrya-audio-streaming` - Serving TTS audio
- `backend-dev-guidelines` - General patterns
- `redis-patterns` - Caching strategies

---

## References

- [Google Gemini TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [ElevenLabs API](https://api.elevenlabs.io/docs)
- [Redis Caching Patterns](https://redis.io/docs/manual/client-side-caching/)
- [Audio Quality Standards](https://en.wikipedia.org/wiki/Audio_quality)

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya TTS Optimization
