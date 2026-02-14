/**
 * Unit test: Gemini providers bootstrap key validation
 * Run with: npx ts-node src/__tests__/ai/gemini-bootstrap.test.ts
 */

import { aiConfig } from '../../ai/ai.config';
import { GeminiTextProvider } from '../../ai/providers/gemini-text.provider';
import { GeminiImageProvider } from '../../ai/providers/gemini-image.provider';
import { GeminiTTSProvider } from '../../ai/providers/gemini-tts.provider';

class TestRunner {
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error: any) {
      console.log(`  ❌ ${name}`);
      console.log(`     Error: ${error.message}`);
      this.failed++;
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

console.log('\n📋 Gemini Bootstrap Tests\n');

const runner = new TestRunner();
const originalGeminiApiKey = aiConfig.providers.gemini?.apiKey ?? '';

runner.test('deve falhar no bootstrap sem GEMINI_API_KEY', () => {
  if (!aiConfig.providers.gemini) {
    throw new Error('Configuração gemini não encontrada');
  }

  aiConfig.providers.gemini.apiKey = '';

  let textError = false;
  let imageError = false;
  let ttsError = false;

  try { new GeminiTextProvider(); } catch { textError = true; }
  try { new GeminiImageProvider(); } catch { imageError = true; }
  try { new GeminiTTSProvider(); } catch { ttsError = true; }

  runner.assertTrue(textError, 'GeminiTextProvider deveria falhar sem chave');
  runner.assertTrue(imageError, 'GeminiImageProvider deveria falhar sem chave');
  runner.assertTrue(ttsError, 'GeminiTTSProvider deveria falhar sem chave');
});

runner.test('deve inicializar bootstrap com GEMINI_API_KEY configurada', () => {
  if (!aiConfig.providers.gemini) {
    throw new Error('Configuração gemini não encontrada');
  }

  aiConfig.providers.gemini.apiKey = 'test-gemini-api-key';

  const textProvider = new GeminiTextProvider();
  const imageProvider = new GeminiImageProvider();
  const ttsProvider = new GeminiTTSProvider();

  runner.assertTrue(!!textProvider, 'GeminiTextProvider deveria ser criado');
  runner.assertTrue(!!imageProvider, 'GeminiImageProvider deveria ser criado');
  runner.assertTrue(!!ttsProvider, 'GeminiTTSProvider deveria ser criado');
});

aiConfig.providers.gemini!.apiKey = originalGeminiApiKey;

const success = runner.summary();
process.exit(success ? 0 : 1);
