import { useState } from 'react';
import { Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import { cn } from '../../../../shared/lib/utils';

interface SceneImageProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

export function SceneImage({ imageUrl, alt = 'Imagem da cena', className }: SceneImageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={cn('flex items-center gap-1.5 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md', className)}>
        <ImageIcon className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs text-red-400">Erro ao carregar imagem</span>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <div className={cn('relative group', className)}>
        <div className="relative w-full aspect-video bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={alt}
            className={cn(
              'w-full h-full object-cover transition-opacity',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Expand Button */}
          {!isLoading && (
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-zinc-950/80 hover:bg-zinc-950 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              title="Expandir imagem"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5 text-zinc-300" />
          </button>

          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
