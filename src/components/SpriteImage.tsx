"use client";

import { useState } from "react";

interface SpriteImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function SpriteImage({
  src,
  alt = "",
  className = "",
  width,
  height,
}: SpriteImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`bg-gray-200 rounded flex items-center justify-center text-gray-400 text-[10px] font-mono dark:bg-zinc-800 dark:text-zinc-600 ${className}`}
        style={{ width, height }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
