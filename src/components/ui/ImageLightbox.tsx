import { useEffect, useCallback, useRef } from 'react';
import { X, ZoomIn } from 'lucide-react';

// ── ImageLightbox ─────────────────────────────────────────────────────────────
interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
        onClick={onClose}
        aria-label="Đóng"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt="Phóng to"
        className="max-w-full max-h-[90vh] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── useClickableImages hook ───────────────────────────────────────────────────
/**
 * Delegate-click handler: mọi <img> bên trong containerRef
 * khi click sẽ mở lightbox với src của ảnh đó.
 */
export function useClickableImages(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onOpen: (src: string) => void,
) {
  const onOpenStable = useCallback(onOpen, [onOpen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const src = (target as HTMLImageElement).src;
        if (src) onOpenStable(src);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [containerRef, onOpenStable]);
}
