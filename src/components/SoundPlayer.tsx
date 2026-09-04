"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SoundPlayerProps {
  soundIds: number[];
}

function getSoundUrl(id: number): string {
  return `https://twotech.twohoursonelife.com/static/sounds/${id}.mp3`;
}

export default function SoundPlayer({ soundIds }: SoundPlayerProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (id: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(getSoundUrl(id));
    audioRef.current = audio;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
    setPlayingId(id);

    audio.addEventListener("ended", () => {
      setPlayingId((current) => (current === id ? null : current));
    });

    audio.addEventListener("error", () => {
      setPlayingId((current) => (current === id ? null : current));
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 dark:text-zinc-500">Sounds:</span>
      {soundIds.map((id) => (
        <button
          key={id}
          onClick={() => playSound(id)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
            playingId === id
              ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50"
              : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-100 hover:text-gray-800 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
          }`}
          title={`Play sound ${id}`}
        >
          {playingId === id ? (
            <Volume2 className="w-3 h-3" />
          ) : (
            <VolumeX className="w-3 h-3" />
          )}
          {id}
        </button>
      ))}
    </div>
  );
}
