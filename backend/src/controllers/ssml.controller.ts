import { Request, Response } from 'express';
import { AIService } from '../ai/ai.service';

export interface SSMLTagSuggestion {
  tag: string;
  description: string;
  example: string;
  category: 'pause' | 'emphasis' | 'prosody' | 'effect' | 'other';
}

export interface SSMLPropertySuggestion {
  property: string;
  value: string;
  description: string;
  confidence: number;
}

/**
 * Controller para assistência de SSML
 */
export class SSMLController {
  private aiService: AIService;

  constructor() {
    this.aiService = AIService.getInstance();
  }

  /**
   * POST /api/ssml/suggest-tags
   * Sugere tags SSML baseado no texto e contexto
   */
  async suggestTags(req: Request, res: Response) {
    try {
      const { text, context, emotion } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      // Build prompt for AI
      const prompt = `Você é um especialista em SSML (Speech Synthesis Markup Language).
Analise o texto abaixo e sugira tags SSML apropriadas para melhorar a expressividade da narração.

${context ? `Contexto: ${context}\n` : ''}${emotion ? `Emoção desejada: ${emotion}\n` : ''}
Texto: "${text}"

Retorne um JSON com array de sugestões no formato:
{
  "suggestions": [
    {
      "tag": "<break time=\"500ms\"/>",
      "description": "Pausa dramática",
      "example": "Ele parou... <break time=\"500ms\"/> e então continuou.",
      "category": "pause"
    }
  ]
}

Categorias válidas: pause, emphasis, prosody, effect, other
Foque em sugestões práticas e relevantes para o texto fornecido.`;

      const response = await this.aiService['textProvider'].generateText({
        prompt,
        temperature: 0.3,
        responseFormat: 'json'
      });

      // Parse response
      let suggestions: SSMLTagSuggestion[] = [];
      try {
        const parsed = JSON.parse(response.text);
        suggestions = parsed.suggestions || [];
      } catch {
        // Fallback: return default suggestions
        suggestions = this.getDefaultTagSuggestions();
      }

      res.json({ suggestions });
    } catch (error: any) {
      console.error('[SSML] Error suggesting tags:', error);
      const status = error.message.includes('insuficiente') ? 402 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * POST /api/ssml/suggest-properties
   * Sugere propriedades SSML (pitch, rate, volume) baseado no texto
   */
  async suggestProperties(req: Request, res: Response) {
    try {
      const { text, characterName, emotion } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      // Build prompt for AI
      const prompt = `Você é um especialista em síntese de voz e SSML.
Analise o texto e sugira propriedades SSML (pitch, rate, volume) para tornar a narração mais expressiva.

${characterName ? `Personagem: ${characterName}\n` : ''}${emotion ? `Emoção: ${emotion}\n` : ''}
Texto: "${text}"

Retorne um JSON com sugestões de propriedades:
{
  "properties": [
    {
      "property": "pitch",
      "value": "+2st",
      "description": "Tom ligeiramente mais alto para expressar empolgação",
      "confidence": 0.85
    },
    {
      "property": "rate",
      "value": "fast",
      "description": "Fala rápida para transmitir urgência",
      "confidence": 0.75
    }
  ]
}

Propriedades válidas:
- pitch: valores como "+2st", "-1st", "high", "low", "medium"
- rate: valores como "fast", "slow", "medium", "x-slow", "x-fast", ou percentuais como "120%"
- volume: valores como "loud", "soft", "medium", "x-loud", "x-soft"

Confidence deve ser entre 0 e 1.`;

      const response = await this.aiService['textProvider'].generateText({
        prompt,
        temperature: 0.3,
        responseFormat: 'json'
      });

      // Parse response
      let properties: SSMLPropertySuggestion[] = [];
      try {
        const parsed = JSON.parse(response.text);
        properties = parsed.properties || [];
      } catch {
        // Fallback: return default properties
        properties = this.getDefaultPropertySuggestions(emotion);
      }

      res.json({ properties });
    } catch (error: any) {
      console.error('[SSML] Error suggesting properties:', error);
      const status = error.message.includes('insuficiente') ? 402 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * POST /api/ssml/apply-suggestions
   * Aplica sugestões SSML ao texto
   */
  async applySuggestions(req: Request, res: Response) {
    try {
      const { text, tags, properties } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      // Build SSML with suggestions
      let ssmlText = text;

      // Apply properties if provided
      if (properties && Object.keys(properties).length > 0) {
        const attrs = Object.entries(properties)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        ssmlText = `<prosody ${attrs}>${ssmlText}</prosody>`;
      }

      // Apply tags if provided (simplified - in production would be more sophisticated)
      if (tags && Array.isArray(tags)) {
        tags.forEach((tag: string) => {
          // Insert tags at appropriate positions (this is simplified)
          // In production, would use NLP to find best insertion points
          ssmlText = ssmlText.replace(/\.\s/g, `. ${tag} `);
        });
      }

      res.json({ ssmlText });
    } catch (error: any) {
      console.error('[SSML] Error applying suggestions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Default tag suggestions fallback
   */
  private getDefaultTagSuggestions(): SSMLTagSuggestion[] {
    return [
      {
        tag: '<break time="500ms"/>',
        description: 'Pausa curta para respiração',
        example: 'Ele parou... <break time="500ms"/> e então continuou.',
        category: 'pause'
      },
      {
        tag: '<emphasis level="moderate"> </emphasis>',
        description: 'Ênfase moderada em palavra importante',
        example: 'Isso é <emphasis level="moderate">muito</emphasis> importante.',
        category: 'emphasis'
      },
      {
        tag: '<prosody pitch="+2st"> </prosody>',
        description: 'Tom mais alto para empolgação',
        example: '<prosody pitch="+2st">Que incrível!</prosody>',
        category: 'prosody'
      }
    ];
  }

  /**
   * Default property suggestions fallback
   */
  private getDefaultPropertySuggestions(emotion?: string): SSMLPropertySuggestion[] {
    const suggestions: SSMLPropertySuggestion[] = [];

    if (emotion === 'happy' || emotion === 'excited') {
      suggestions.push(
        { property: 'pitch', value: '+2st', description: 'Tom mais alto para alegria', confidence: 0.8 },
        { property: 'rate', value: 'fast', description: 'Fala rápida para empolgação', confidence: 0.75 }
      );
    } else if (emotion === 'sad' || emotion === 'melancholic') {
      suggestions.push(
        { property: 'pitch', value: '-1st', description: 'Tom mais baixo para tristeza', confidence: 0.8 },
        { property: 'rate', value: 'slow', description: 'Fala lenta para melancolia', confidence: 0.75 }
      );
    } else if (emotion === 'angry' || emotion === 'intense') {
      suggestions.push(
        { property: 'volume', value: 'loud', description: 'Volume alto para intensidade', confidence: 0.85 },
        { property: 'rate', value: 'fast', description: 'Fala rápida para raiva', confidence: 0.7 }
      );
    } else {
      // Neutral suggestions
      suggestions.push(
        { property: 'rate', value: 'medium', description: 'Ritmo natural', confidence: 0.9 },
        { property: 'pitch', value: 'medium', description: 'Tom neutro', confidence: 0.9 }
      );
    }

    return suggestions;
  }
}

export const ssmlController = new SSMLController();
