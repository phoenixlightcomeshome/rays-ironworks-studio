import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Resolves a root-relative asset path (e.g. "/images/foo.jpg") against the
 * Vite base (import.meta.env.BASE_URL — "/rays-ironworks-studio/" on GitHub
 * Pages) so images load when the app is served from a subpath. Absolute
 * URLs, data: URLs and relative paths pass through untouched.
 */
export function resolveAssetPath(src: string): string {
  if (!src.startsWith('/')) return src;
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}${src}`;
}

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  onClick?: () => void;
}


export function ResilientImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  onClick,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);


  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[#1a1a1e] border border-[#2a2a2e] text-[#a8a29a] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-6 h-6 text-[#c9883d]" aria-hidden="true" />
        <span className="text-sm">{alt}</span>
      </div>
    );
  }


  return (
    <img
      src={resolveAssetPath(src)}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onClick={onClick}
      className={className}
    />
  );
}
