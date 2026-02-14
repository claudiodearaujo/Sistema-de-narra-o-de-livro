/**
 * SSML Visual Abstraction Layer
 *
 * Converts between human-friendly visual markers (shown to the writer)
 * and raw SSML XML (sent to the TTS backend).
 *
 * Writers never see XML. They see intuitive inline markers like:
 *   [pausa 500ms]  [ênfase]texto[/ênfase]  [tom +2]texto[/tom]
 *
 * These are converted to/from SSML before saving/loading.
 */

// ─── Marker Definitions ─────────────────────────────────────────────────────

export interface VisualMarkerDef {
  /** Unique identifier */
  id: string;
  /** Display label in the toolbar */
  label: string;
  /** Short description for tooltips */
  description: string;
  /** Whether this is a self-closing marker (no content) or wraps text */
  type: 'self-closing' | 'wrapping';
  /** The visual marker string inserted into the editor */
  visualOpen: string;
  /** Closing visual marker (only for wrapping type) */
  visualClose?: string;
  /** Regex to match visual markers in text */
  visualPattern: RegExp;
  /** Function to produce SSML from a regex match */
  toSSML: (match: RegExpExecArray) => string;
  /** Regex to match SSML in text */
  ssmlPattern: RegExp;
  /** Function to produce visual markers from a regex match */
  toVisual: (match: RegExpExecArray) => string;
  /** Category for grouping */
  category: 'pause' | 'emphasis' | 'prosody' | 'effect';
}

export const VISUAL_MARKERS: VisualMarkerDef[] = [
  // ── Pause (self-closing) ────────────────────────────────────────────────
  {
    id: 'pause',
    label: 'Pausa',
    description: 'Insere uma pausa na narração',
    type: 'self-closing',
    category: 'pause',
    visualOpen: '[pausa 500ms]',
    visualPattern: /\[pausa\s+(\d+)(ms|s)\]/g,
    toSSML: (m) => `<break time="${m[1]}${m[2]}"/>`,
    ssmlPattern: /<break\s+time="(\d+)(ms|s)"\/>/g,
    toVisual: (m) => `[pausa ${m[1]}${m[2]}]`,
  },

  // ── Emphasis (wrapping) ─────────────────────────────────────────────────
  {
    id: 'emphasis',
    label: 'Ênfase',
    description: 'Enfatiza o trecho selecionado',
    type: 'wrapping',
    category: 'emphasis',
    visualOpen: '[ênfase]',
    visualClose: '[/ênfase]',
    visualPattern: /\[ênfase\]([\s\S]*?)\[\/ênfase\]/g,
    toSSML: (m) => `<emphasis level="moderate">${m[1]}</emphasis>`,
    ssmlPattern: /<emphasis\s+level="([\w]+)">([\s\S]*?)<\/emphasis>/g,
    toVisual: (m) => `[ênfase]${m[2]}[/ênfase]`,
  },

  // ── Pitch Up (wrapping) ─────────────────────────────────────────────────
  {
    id: 'pitch-up',
    label: 'Tom+',
    description: 'Aumenta o tom da voz',
    type: 'wrapping',
    category: 'prosody',
    visualOpen: '[tom +2]',
    visualClose: '[/tom]',
    visualPattern: /\[tom\s*\+(\d+)\]([\s\S]*?)\[\/tom\]/g,
    toSSML: (m) => `<prosody pitch="+${m[1]}st">${m[2]}</prosody>`,
    ssmlPattern: /<prosody\s+pitch="\+(\d+)st">([\s\S]*?)<\/prosody>/g,
    toVisual: (m) => `[tom +${m[1]}]${m[2]}[/tom]`,
  },

  // ── Pitch Down (wrapping) ───────────────────────────────────────────────
  {
    id: 'pitch-down',
    label: 'Tom-',
    description: 'Diminui o tom da voz',
    type: 'wrapping',
    category: 'prosody',
    visualOpen: '[tom -2]',
    visualClose: '[/tom]',
    visualPattern: /\[tom\s*-(\d+)\]([\s\S]*?)\[\/tom\]/g,
    toSSML: (m) => `<prosody pitch="-${m[1]}st">${m[2]}</prosody>`,
    ssmlPattern: /<prosody\s+pitch="-(\d+)st">([\s\S]*?)<\/prosody>/g,
    toVisual: (m) => `[tom -${m[1]}]${m[2]}[/tom]`,
  },

  // ── Whisper (wrapping) ──────────────────────────────────────────────────
  {
    id: 'whisper',
    label: 'Sussurro',
    description: 'Voz sussurrada',
    type: 'wrapping',
    category: 'effect',
    visualOpen: '[sussurro]',
    visualClose: '[/sussurro]',
    visualPattern: /\[sussurro\]([\s\S]*?)\[\/sussurro\]/g,
    toSSML: (m) => `<amazon:effect name="whispered">${m[1]}</amazon:effect>`,
    ssmlPattern: /<amazon:effect\s+name="whispered">([\s\S]*?)<\/amazon:effect>/g,
    toVisual: (m) => `[sussurro]${m[1]}[/sussurro]`,
  },

  // ── Volume Loud (wrapping) ──────────────────────────────────────────────
  {
    id: 'volume-loud',
    label: 'Forte',
    description: 'Volume alto',
    type: 'wrapping',
    category: 'prosody',
    visualOpen: '[forte]',
    visualClose: '[/forte]',
    visualPattern: /\[forte\]([\s\S]*?)\[\/forte\]/g,
    toSSML: (m) => `<prosody volume="loud">${m[1]}</prosody>`,
    ssmlPattern: /<prosody\s+volume="loud">([\s\S]*?)<\/prosody>/g,
    toVisual: (m) => `[forte]${m[1]}[/forte]`,
  },

  // ── Volume Soft (wrapping) ──────────────────────────────────────────────
  {
    id: 'volume-soft',
    label: 'Suave',
    description: 'Volume suave',
    type: 'wrapping',
    category: 'prosody',
    visualOpen: '[suave]',
    visualClose: '[/suave]',
    visualPattern: /\[suave\]([\s\S]*?)\[\/suave\]/g,
    toSSML: (m) => `<prosody volume="soft">${m[1]}</prosody>`,
    ssmlPattern: /<prosody\s+volume="soft">([\s\S]*?)<\/prosody>/g,
    toVisual: (m) => `[suave]${m[1]}[/suave]`,
  },
];

// ─── Conversion Functions ────────────────────────────────────────────────────

/**
 * Convert visual markers to SSML XML.
 * Called before sending text to the backend.
 */
export function visualToSSML(text: string): string {
  let result = text;
  for (const marker of VISUAL_MARKERS) {
    result = result.replace(
      marker.visualPattern,
      (...args) => {
        // Reset lastIndex for global regex (replace creates a fresh one internally)
        const match = args as unknown as RegExpExecArray;
        return marker.toSSML(match);
      }
    );
  }
  return result;
}

/**
 * Convert SSML XML to visual markers.
 * Called when loading text from the backend for editing.
 */
export function ssmlToVisual(text: string): string {
  let result = text;
  for (const marker of VISUAL_MARKERS) {
    result = result.replace(
      marker.ssmlPattern,
      (...args) => {
        const match = args as unknown as RegExpExecArray;
        return marker.toVisual(match);
      }
    );
  }
  return result;
}

/**
 * Check if a text contains any visual markers.
 */
export function hasVisualMarkers(text: string): boolean {
  return VISUAL_MARKERS.some((marker) => {
    // Clone regex to avoid shared lastIndex
    const pattern = new RegExp(marker.visualPattern.source, marker.visualPattern.flags);
    return pattern.test(text);
  });
}

/**
 * Check if a text contains any raw SSML tags.
 */
export function hasSSMLTags(text: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(text);
}

/**
 * Parse visual markers out of text into segments for rich rendering.
 * Returns an array of segments: plain text and marker tokens.
 */
export type TextSegment =
  | { type: 'text'; content: string }
  | { type: 'marker-open'; markerId: string; label: string; param?: string }
  | { type: 'marker-close'; markerId: string }
  | { type: 'marker-self'; markerId: string; label: string; param: string };

export function parseVisualMarkers(text: string): TextSegment[] {
  // Build a combined regex that matches all marker patterns
  const patterns: Array<{ regex: RegExp; markerId: string; markerType: 'self-closing' | 'wrapping' }> = [];

  // Self-closing: [pausa 500ms]
  patterns.push({
    regex: /\[pausa\s+(\d+(?:ms|s))\]/g,
    markerId: 'pause',
    markerType: 'self-closing',
  });

  // Opening tags: [ênfase], [tom +2], [tom -2], [sussurro], [forte], [suave]
  patterns.push({ regex: /\[ênfase\]/g, markerId: 'emphasis', markerType: 'wrapping' });
  patterns.push({ regex: /\[tom\s*(\+\d+)\]/g, markerId: 'pitch-up', markerType: 'wrapping' });
  patterns.push({ regex: /\[tom\s*(-\d+)\]/g, markerId: 'pitch-down', markerType: 'wrapping' });
  patterns.push({ regex: /\[sussurro\]/g, markerId: 'whisper', markerType: 'wrapping' });
  patterns.push({ regex: /\[forte\]/g, markerId: 'volume-loud', markerType: 'wrapping' });
  patterns.push({ regex: /\[suave\]/g, markerId: 'volume-soft', markerType: 'wrapping' });

  // Closing tags
  patterns.push({ regex: /\[\/ênfase\]/g, markerId: 'emphasis-close', markerType: 'wrapping' });
  patterns.push({ regex: /\[\/tom\]/g, markerId: 'pitch-close', markerType: 'wrapping' });
  patterns.push({ regex: /\[\/sussurro\]/g, markerId: 'whisper-close', markerType: 'wrapping' });
  patterns.push({ regex: /\[\/forte\]/g, markerId: 'volume-loud-close', markerType: 'wrapping' });
  patterns.push({ regex: /\[\/suave\]/g, markerId: 'volume-soft-close', markerType: 'wrapping' });

  // Find all matches with positions
  interface MatchInfo {
    index: number;
    length: number;
    markerId: string;
    markerType: 'self-closing' | 'wrapping';
    param?: string;
    isClose: boolean;
  }

  const matches: MatchInfo[] = [];

  for (const { regex, markerId, markerType } of patterns) {
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const isClose = markerId.endsWith('-close');
      matches.push({
        index: m.index,
        length: m[0].length,
        markerId: isClose ? markerId.replace('-close', '') : markerId,
        markerType,
        param: m[1],
        isClose,
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.index - b.index);

  // Build segments
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    // Add text before this match
    if (match.index > cursor) {
      segments.push({ type: 'text', content: text.slice(cursor, match.index) });
    }

    if (match.markerType === 'self-closing' && !match.isClose) {
      const def = VISUAL_MARKERS.find((m) => m.id === match.markerId);
      segments.push({
        type: 'marker-self',
        markerId: match.markerId,
        label: def?.label ?? match.markerId,
        param: match.param ?? '',
      });
    } else if (match.isClose) {
      segments.push({
        type: 'marker-close',
        markerId: match.markerId,
      });
    } else {
      const def = VISUAL_MARKERS.find((m) => m.id === match.markerId);
      segments.push({
        type: 'marker-open',
        markerId: match.markerId,
        label: def?.label ?? match.markerId,
        param: match.param,
      });
    }

    cursor = match.index + match.length;
  }

  // Add remaining text
  if (cursor < text.length) {
    segments.push({ type: 'text', content: text.slice(cursor) });
  }

  return segments;
}

// ─── Toolbar Helpers ─────────────────────────────────────────────────────────

/**
 * Get the visual marker string to insert for a given marker ID.
 * For wrapping markers, if selectedText is provided, wraps it.
 */
export function getInsertText(markerId: string, selectedText = ''): string {
  const def = VISUAL_MARKERS.find((m) => m.id === markerId);
  if (!def) return '';

  if (def.type === 'self-closing') {
    return def.visualOpen;
  }

  const content = selectedText || ' ';
  return `${def.visualOpen}${content}${def.visualClose}`;
}
