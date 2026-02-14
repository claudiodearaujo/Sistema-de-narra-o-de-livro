import { describe, it, expect } from 'vitest';
import {
  visualToSSML,
  ssmlToVisual,
  hasVisualMarkers,
  hasSSMLTags,
  parseVisualMarkers,
  getInsertText,
} from '../ssml';

// ─── visualToSSML ────────────────────────────────────────────────────────────

describe('visualToSSML', () => {
  it('converts pause marker', () => {
    expect(visualToSSML('[pausa 500ms]')).toBe('<break time="500ms"/>');
    expect(visualToSSML('[pausa 1s]')).toBe('<break time="1s"/>');
    expect(visualToSSML('[pausa 200ms]')).toBe('<break time="200ms"/>');
  });

  it('converts emphasis marker', () => {
    expect(visualToSSML('[ênfase]texto importante[/ênfase]')).toBe(
      '<emphasis level="moderate">texto importante</emphasis>'
    );
  });

  it('converts pitch up marker', () => {
    expect(visualToSSML('[tom +2]pergunta?[/tom]')).toBe(
      '<prosody pitch="+2st">pergunta?</prosody>'
    );
  });

  it('converts pitch down marker', () => {
    expect(visualToSSML('[tom -2]voz grave[/tom]')).toBe(
      '<prosody pitch="-2st">voz grave</prosody>'
    );
  });

  it('converts whisper marker', () => {
    expect(visualToSSML('[sussurro]segredo[/sussurro]')).toBe(
      '<amazon:effect name="whispered">segredo</amazon:effect>'
    );
  });

  it('converts volume loud marker', () => {
    expect(visualToSSML('[forte]GRITANDO[/forte]')).toBe(
      '<prosody volume="loud">GRITANDO</prosody>'
    );
  });

  it('converts volume soft marker', () => {
    expect(visualToSSML('[suave]sussurrando[/suave]')).toBe(
      '<prosody volume="soft">sussurrando</prosody>'
    );
  });

  it('preserves text without markers', () => {
    const text = 'Este é um texto normal sem marcadores.';
    expect(visualToSSML(text)).toBe(text);
  });

  it('handles multiple markers in one text', () => {
    const input = 'Ele disse [pausa 500ms] com [ênfase]muita força[/ênfase] e [sussurro]depois sussurrou[/sussurro].';
    const expected =
      'Ele disse <break time="500ms"/> com <emphasis level="moderate">muita força</emphasis> e <amazon:effect name="whispered">depois sussurrou</amazon:effect>.';
    expect(visualToSSML(input)).toBe(expected);
  });

  it('handles nested-like scenarios (sequential markers)', () => {
    const input = '[forte]Grito![/forte] [pausa 1s] [suave]calma...[/suave]';
    const expected =
      '<prosody volume="loud">Grito!</prosody> <break time="1s"/> <prosody volume="soft">calma...</prosody>';
    expect(visualToSSML(input)).toBe(expected);
  });
});

// ─── ssmlToVisual ────────────────────────────────────────────────────────────

describe('ssmlToVisual', () => {
  it('converts SSML break to pause marker', () => {
    expect(ssmlToVisual('<break time="500ms"/>')).toBe('[pausa 500ms]');
    expect(ssmlToVisual('<break time="1s"/>')).toBe('[pausa 1s]');
  });

  it('converts SSML emphasis to ênfase marker', () => {
    expect(ssmlToVisual('<emphasis level="moderate">texto</emphasis>')).toBe(
      '[ênfase]texto[/ênfase]'
    );
  });

  it('converts SSML prosody pitch up', () => {
    expect(ssmlToVisual('<prosody pitch="+2st">texto</prosody>')).toBe(
      '[tom +2]texto[/tom]'
    );
  });

  it('converts SSML prosody pitch down', () => {
    expect(ssmlToVisual('<prosody pitch="-2st">texto</prosody>')).toBe(
      '[tom -2]texto[/tom]'
    );
  });

  it('converts SSML whisper effect', () => {
    expect(ssmlToVisual('<amazon:effect name="whispered">texto</amazon:effect>')).toBe(
      '[sussurro]texto[/sussurro]'
    );
  });

  it('converts SSML volume loud', () => {
    expect(ssmlToVisual('<prosody volume="loud">texto</prosody>')).toBe(
      '[forte]texto[/forte]'
    );
  });

  it('converts SSML volume soft', () => {
    expect(ssmlToVisual('<prosody volume="soft">texto</prosody>')).toBe(
      '[suave]texto[/suave]'
    );
  });

  it('preserves text without SSML', () => {
    const text = 'Este é um texto normal sem SSML.';
    expect(ssmlToVisual(text)).toBe(text);
  });

  it('handles mixed SSML tags', () => {
    const input =
      'Ele disse <break time="500ms"/> com <emphasis level="moderate">muita força</emphasis>.';
    const expected = 'Ele disse [pausa 500ms] com [ênfase]muita força[/ênfase].';
    expect(ssmlToVisual(input)).toBe(expected);
  });
});

// ─── Round-Trip ──────────────────────────────────────────────────────────────

describe('round-trip conversion', () => {
  const testCases = [
    'Texto simples sem marcadores.',
    '[pausa 500ms]',
    '[ênfase]texto enfatizado[/ênfase]',
    '[tom +2]pergunta?[/tom]',
    '[tom -2]voz grave[/tom]',
    '[sussurro]segredo[/sussurro]',
    '[forte]GRITANDO[/forte]',
    '[suave]sussurrando[/suave]',
    'Ele disse [pausa 500ms] com [ênfase]ênfase[/ênfase] e [sussurro]sussurrou[/sussurro].',
  ];

  testCases.forEach((visual) => {
    it(`visual → SSML → visual: "${visual.slice(0, 50)}..."`, () => {
      const ssml = visualToSSML(visual);
      const backToVisual = ssmlToVisual(ssml);
      expect(backToVisual).toBe(visual);
    });
  });

  const ssmlCases = [
    '<break time="500ms"/>',
    '<emphasis level="moderate">texto</emphasis>',
    '<prosody pitch="+2st">pergunta?</prosody>',
    '<prosody pitch="-2st">voz grave</prosody>',
    '<amazon:effect name="whispered">segredo</amazon:effect>',
    '<prosody volume="loud">GRITANDO</prosody>',
    '<prosody volume="soft">sussurrando</prosody>',
  ];

  ssmlCases.forEach((ssml) => {
    it(`SSML → visual → SSML: "${ssml.slice(0, 50)}..."`, () => {
      const visual = ssmlToVisual(ssml);
      const backToSSML = visualToSSML(visual);
      expect(backToSSML).toBe(ssml);
    });
  });
});

// ─── hasVisualMarkers ────────────────────────────────────────────────────────

describe('hasVisualMarkers', () => {
  it('detects visual markers', () => {
    expect(hasVisualMarkers('[pausa 500ms]')).toBe(true);
    expect(hasVisualMarkers('texto com [ênfase]ênfase[/ênfase]')).toBe(true);
    expect(hasVisualMarkers('[sussurro]secreto[/sussurro]')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasVisualMarkers('texto normal')).toBe(false);
    expect(hasVisualMarkers('sem marcadores aqui')).toBe(false);
  });

  it('returns false for SSML (not visual markers)', () => {
    expect(hasVisualMarkers('<break time="500ms"/>')).toBe(false);
  });
});

// ─── hasSSMLTags ─────────────────────────────────────────────────────────────

describe('hasSSMLTags', () => {
  it('detects SSML tags', () => {
    expect(hasSSMLTags('<break time="500ms"/>')).toBe(true);
    expect(hasSSMLTags('<emphasis level="moderate">text</emphasis>')).toBe(true);
    expect(hasSSMLTags('<prosody pitch="+2st">text</prosody>')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasSSMLTags('texto normal')).toBe(false);
  });

  it('returns false for visual markers', () => {
    expect(hasSSMLTags('[pausa 500ms]')).toBe(false);
    expect(hasSSMLTags('[ênfase]texto[/ênfase]')).toBe(false);
  });
});

// ─── parseVisualMarkers ──────────────────────────────────────────────────────

describe('parseVisualMarkers', () => {
  it('returns single text segment for plain text', () => {
    const result = parseVisualMarkers('texto normal');
    expect(result).toEqual([{ type: 'text', content: 'texto normal' }]);
  });

  it('parses self-closing pause marker', () => {
    const result = parseVisualMarkers('antes [pausa 500ms] depois');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', content: 'antes ' });
    expect(result[1]).toEqual({ type: 'marker-self', markerId: 'pause', label: 'Pausa', param: '500ms' });
    expect(result[2]).toEqual({ type: 'text', content: ' depois' });
  });

  it('parses wrapping emphasis markers', () => {
    const result = parseVisualMarkers('antes [ênfase]meio[/ênfase] depois');
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ type: 'text', content: 'antes ' });
    expect(result[1]).toEqual({ type: 'marker-open', markerId: 'emphasis', label: 'Ênfase', param: undefined });
    expect(result[2]).toEqual({ type: 'text', content: 'meio' });
    expect(result[3]).toEqual({ type: 'marker-close', markerId: 'emphasis' });
    expect(result[4]).toEqual({ type: 'text', content: ' depois' });
  });

  it('parses pitch markers with parameters', () => {
    const result = parseVisualMarkers('[tom +2]pergunta?[/tom]');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'marker-open', markerId: 'pitch-up', label: 'Tom+', param: '+2' });
    expect(result[1]).toEqual({ type: 'text', content: 'pergunta?' });
    // [/tom] closing tag is shared between pitch-up and pitch-down
    expect(result[2]).toEqual({ type: 'marker-close', markerId: 'pitch' });
  });

  it('handles multiple markers', () => {
    const result = parseVisualMarkers('[pausa 300ms] [forte]grito[/forte]');
    expect(result.length).toBeGreaterThan(3);
    const types = result.map((s) => s.type);
    expect(types).toContain('marker-self');
    expect(types).toContain('marker-open');
    expect(types).toContain('marker-close');
  });
});

// ─── getInsertText ───────────────────────────────────────────────────────────

describe('getInsertText', () => {
  it('returns self-closing marker for pause', () => {
    expect(getInsertText('pause')).toBe('[pausa 500ms]');
  });

  it('returns wrapping marker with space for emphasis', () => {
    expect(getInsertText('emphasis')).toBe('[ênfase] [/ênfase]');
  });

  it('wraps selected text for wrapping markers', () => {
    expect(getInsertText('emphasis', 'texto selecionado')).toBe('[ênfase]texto selecionado[/ênfase]');
    expect(getInsertText('whisper', 'segredo')).toBe('[sussurro]segredo[/sussurro]');
  });

  it('returns empty string for unknown marker', () => {
    expect(getInsertText('unknown')).toBe('');
  });
});
