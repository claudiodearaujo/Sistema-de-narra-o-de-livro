import { useMemo } from 'react';
import { parseVisualMarkers, ssmlToVisual, hasSSMLTags, type TextSegment } from '../../../../shared/lib/ssml';
import { cn } from '../../../../shared/lib/utils';

interface RichTextDisplayProps {
  text: string;
  className?: string;
}

const MARKER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pause:         { bg: 'bg-zinc-700/50',   text: 'text-zinc-300',   border: 'border-zinc-600' },
  emphasis:      { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30' },
  'pitch-up':    { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  'pitch-down':  { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  whisper:       { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  'volume-loud': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'volume-soft': { bg: 'bg-teal-500/15',  text: 'text-teal-400',   border: 'border-teal-500/30' },
};

const MARKER_LABELS: Record<string, string> = {
  pause: 'pausa',
  emphasis: 'ênfase',
  'pitch-up': 'tom+',
  'pitch-down': 'tom-',
  whisper: 'sussurro',
  'volume-loud': 'forte',
  'volume-soft': 'suave',
};

/**
 * Renders text with visual markers as inline badges.
 * Converts SSML from the backend to visual markers, then renders them as styled chips.
 *
 * Writer sees: "Ele disse [pausa 500ms] com [ênfase]muita força[/ênfase]"
 * Rendered as: "Ele disse ⏸500ms com ✦muita força✦"
 */
export function RichTextDisplay({ text, className }: RichTextDisplayProps) {
  const segments = useMemo(() => {
    // If text contains raw SSML from backend, convert to visual first
    const visualText = hasSSMLTags(text) ? ssmlToVisual(text) : text;
    return parseVisualMarkers(visualText);
  }, [text]);

  // If no markers found, render plain text
  const hasMarkers = segments.some((s) => s.type !== 'text');
  if (!hasMarkers) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, i) => (
        <SegmentRenderer key={i} segment={segment} />
      ))}
    </span>
  );
}

function SegmentRenderer({ segment }: { segment: TextSegment }) {
  switch (segment.type) {
    case 'text':
      return <>{segment.content}</>;

    case 'marker-self': {
      const colors = MARKER_COLORS[segment.markerId] ?? MARKER_COLORS.pause;
      return (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0 mx-0.5 rounded text-[10px] font-medium border align-baseline',
            colors.bg, colors.text, colors.border
          )}
          title={`${MARKER_LABELS[segment.markerId] ?? segment.markerId}: ${segment.param}`}
        >
          <span className="opacity-70">⏸</span>
          {segment.param}
        </span>
      );
    }

    case 'marker-open': {
      const colors = MARKER_COLORS[segment.markerId] ?? MARKER_COLORS.emphasis;
      return (
        <span
          className={cn(
            'inline-flex items-center px-1 py-0 ml-0.5 rounded-l text-[10px] font-medium border-l border-y align-baseline',
            colors.bg, colors.text, colors.border
          )}
          title={MARKER_LABELS[segment.markerId] ?? segment.markerId}
        >
          {(MARKER_LABELS[segment.markerId] ?? segment.markerId)}
          {segment.param && <span className="ml-0.5 opacity-80">{segment.param}</span>}
          <span className="ml-0.5 opacity-50">›</span>
        </span>
      );
    }

    case 'marker-close': {
      const colors = MARKER_COLORS[segment.markerId] ?? MARKER_COLORS.emphasis;
      return (
        <span
          className={cn(
            'inline-flex items-center px-1 py-0 mr-0.5 rounded-r text-[10px] font-medium border-r border-y align-baseline',
            colors.bg, colors.text, colors.border
          )}
        >
          <span className="opacity-50">‹</span>
        </span>
      );
    }

    default:
      return null;
  }
}
