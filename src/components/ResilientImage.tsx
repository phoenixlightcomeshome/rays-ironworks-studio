import { useState } from 'react';
import { ImageOff } from 'lucide-react';

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
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      onClick={onClick}
      className={className}
    />
  );
}
