import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  image: LightboxImage | null;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image preview"
          className="self-end inline-flex items-center justify-center w-11 h-11 rounded-lg bg-[#1c1c1f] border border-[#2a2a2e] text-[#f2efe8] hover:border-[#e8a317] hover:text-[#e8a317] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <ResilientImage
          src={image.src}
          alt={image.alt}
          loading="eager"
          className="max-h-[78vh] w-auto max-w-full rounded-lg border border-[#2a2a2e] object-contain"
        />
        {(image.caption || image.alt) && (
          <p className="text-sm text-[#cfc9bf] text-center max-w-2xl">
            {image.caption || image.alt}
          </p>
        )}
      </div>
    </div>
  );
}
