'use client';
import { useRef, useState } from 'react';
import { CoverrVideo } from '@/lib/types';

interface Props {
  video: CoverrVideo;
  isFavorite: boolean;
  onSelect: (v: CoverrVideo) => void;
  onFavorite: (v: CoverrVideo) => void;
}

export default function ThumbnailCard({ video, isFavorite, onSelect, onFavorite }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(video)}
    >
      {/* Thumbnail image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={video.thumbnail}
        alt={video.title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          hovered ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Hover preview video — desktop */}
      <video
        ref={videoRef}
        src={video.urls.mp4_preview}
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Overlay: title + favorite */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              navigator.clipboard.writeText(video.id).catch(() => {});
            }}
            className="px-1.5 py-0.5 rounded bg-black/60 text-white/70 hover:text-white text-[10px] font-mono transition"
            title={`Copy ID: ${video.id}`}
            aria-label="Copy video ID"
          >
            ID
          </button>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-2 flex items-end justify-between">
          <span className="text-white text-xs font-medium truncate">{video.title}</span>
          <button
            onClick={e => { e.stopPropagation(); onFavorite(video); }}
            className="text-white text-base ml-1 shrink-0"
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
}
