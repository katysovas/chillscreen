'use client';
import { useState, useEffect, useCallback } from 'react';
import { CoverrVideo } from '@/lib/types';

interface Props {
  video: CoverrVideo;
  audioPlaying: boolean;
  isFavorite: boolean;
  onBrowse: () => void;
  onAudioToggle: () => void;
  onVolumeChange: (v: number) => void;
  onFavorite: () => void;
}

export default function SceneOverlay({
  video,
  audioPlaying,
  isFavorite,
  onBrowse,
  onAudioToggle,
  onVolumeChange,
  onFavorite,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    setIsMobile(window.matchMedia('(hover: none)').matches);
  }, []);

  // Desktop: hide overlay after 3s of mouse inactivity
  const resetTimer = useCallback(() => {
    if (isMobile) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return t;
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const t = setTimeout(() => setVisible(false), 3000);
    const onMove = () => {
      setVisible(true);
      clearTimeout(t);
    };
    document.addEventListener('mousemove', onMove);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousemove', onMove);
    };
  }, [isMobile, resetTimer]);

  // Mobile: tap anywhere toggles overlay
  useEffect(() => {
    if (!isMobile) return;
    const onTap = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[data-overlay-btn]')) return;
      setVisible(v => !v);
    };
    document.addEventListener('touchend', onTap);
    return () => document.removeEventListener('touchend', onTap);
  }, [isMobile]);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    onVolumeChange(v);
  };

  return (
    <div
      className={`absolute inset-x-0 bottom-0 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
    >
      <div className="px-4 pb-5 pt-12 flex flex-col gap-3">
        {/* Top row: title + favorite + browse */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-white font-semibold text-sm truncate drop-shadow">
            🌿 {video.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              data-overlay-btn
              onClick={onFavorite}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white text-lg"
              aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
            <button
              data-overlay-btn
              onClick={onBrowse}
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 transition text-white text-sm font-medium"
            >
              Browse
            </button>
          </div>
        </div>

        {/* Bottom row: audio + coverr logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              data-overlay-btn
              onClick={onAudioToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white text-sm"
            >
              {audioPlaying ? '🔊' : '🔇'}
              <span className="hidden sm:inline">{audioPlaying ? 'Sound on' : 'Sound off'}</span>
            </button>
            {/* Volume slider — desktop only */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              className="hidden md:block w-20 accent-white"
              aria-label="Volume"
            />
          </div>

          {/* Coverr attribution — required */}
          <a
            href="https://coverr.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition text-xs"
            data-overlay-btn
          >
            <span className="font-semibold tracking-wide">coverr</span>
          </a>
        </div>
      </div>
    </div>
  );
}
