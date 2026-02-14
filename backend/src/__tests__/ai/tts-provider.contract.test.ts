import axios from 'axios';
import { ElevenLabsTTSProvider } from '../../ai/providers/elevenlabs-tts.provider';
import { aiConfig } from '../../ai/ai.config';
import { AIFactory } from '../../ai/ai.factory';

class TestRunner {
  private passed = 0;
  private failed = 0;

  async test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error: any) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      this.failed++;
    }
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(value: boolean, message?: string) {
    if (!value) {
      throw new Error(message || 'Expected true but got false');
    }
  }

  summary() {
    console.log(`\n  Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

console.log('\n📋 TTS Provider Contract Tests\n');

const runner = new TestRunner();

const originalPost = axios.post;
const originalGet = axios.get;
const originalDefaultTTS = aiConfig.defaultTTSProvider;
const originalElevenLabsConfig = aiConfig.providers.elevenlabs
  ? { ...aiConfig.providers.elevenlabs, voiceSettings: { ...aiConfig.providers.elevenlabs.voiceSettings } }
  : undefined;

async function run() {
  aiConfig.providers.elevenlabs = {
    apiKey: 'test-api-key',
    defaultVoice: 'voice-default',
    defaultModel: 'eleven_multilingual_v2',
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0,
      useSpeakerBoost: true
    }
  };

  await runner.test('ElevenLabs generateAudio should return AudioResult contract', async () => {
    let calledUrl = '';
    (axios.post as any) = async (url: string) => {
      calledUrl = url;
      return { data: Buffer.from('audio-content') };
    };

    const provider = new ElevenLabsTTSProvider();
    const result = await provider.generateAudio({
      text: 'Olá mundo',
      voice: { voiceId: 'voice-123' },
      outputFormat: 'mp3'
    });

    runner.assertTrue(calledUrl.includes('/text-to-speech/voice-123'), 'Should call ElevenLabs TTS endpoint');
    runner.assertEqual(result.format, 'mp3');
    runner.assertTrue(Buffer.isBuffer(result.buffer), 'Result buffer should be a Buffer');

    (provider as any).rateLimiter.destroy();
  });

  await runner.test('ElevenLabs getAvailableVoices should map provider voices contract', async () => {
    (axios.get as any) = async () => ({
      data: {
        voices: [
          {
            voice_id: 'voice-1',
            name: 'Narradora',
            labels: { gender: 'female' },
            description: 'Voz de teste',
            preview_url: 'https://example.com/preview.mp3'
          }
        ]
      }
    });

    const provider = new ElevenLabsTTSProvider();
    const voices = await provider.getAvailableVoices();

    runner.assertEqual(voices.length, 1);
    runner.assertEqual(voices[0].id, 'voice-1');
    runner.assertEqual(voices[0].provider, 'elevenlabs');
    runner.assertEqual(voices[0].gender, 'FEMALE');

    (provider as any).rateLimiter.destroy();
  });

  await runner.test('ElevenLabs previewVoice should return audio in provider contract', async () => {
    (axios.post as any) = async () => ({ data: Buffer.from('preview-audio') });

    const provider = new ElevenLabsTTSProvider();
    const result = await provider.previewVoice('voice-preview', 'Texto de preview');

    runner.assertEqual(result.format, 'mp3');
    runner.assertTrue(result.buffer.length > 0, 'Preview should return non-empty audio buffer');

    (provider as any).rateLimiter.destroy();
  });

  await runner.test('Factory should throw explicit configuration error for unimplemented default provider', () => {
    aiConfig.defaultTTSProvider = 'azure';

    let errorMessage = '';
    try {
      AIFactory.validateDefaultProviders();
    } catch (error: any) {
      errorMessage = error.message;
    }

    runner.assertTrue(
      errorMessage.includes('AI_TTS_PROVIDER') && errorMessage.includes('não está implementado'),
      'Should have explicit config error mentioning AI_TTS_PROVIDER'
    );
  });

  (axios.post as any) = originalPost;
  (axios.get as any) = originalGet;
  aiConfig.defaultTTSProvider = originalDefaultTTS;

  if (originalElevenLabsConfig) {
    aiConfig.providers.elevenlabs = originalElevenLabsConfig;
  }

  const success = runner.summary();
  process.exit(success ? 0 : 1);
}

run().catch((error) => {
  console.error('Unexpected test failure:', error);
  (axios.post as any) = originalPost;
  (axios.get as any) = originalGet;
  aiConfig.defaultTTSProvider = originalDefaultTTS;
  if (originalElevenLabsConfig) {
    aiConfig.providers.elevenlabs = originalElevenLabsConfig;
  }
  process.exit(1);
});
