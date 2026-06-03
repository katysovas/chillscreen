'use client';
import { useEffect, useRef, useState } from 'react';
import { CoverrVideo, CoverrAudio } from '@/lib/types';
import { storage } from '@/lib/storage';
import { fetchRandomVideo, fetchRandomAudio, pingDownload } from '@/lib/coverr';
import SceneOverlay from './SceneOverlay';
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer';
import BrowseDrawer from './BrowseDrawer';

export default function VideoPlayer() {
  const [video, setVideo] = useState<CoverrVideo | null>(null);
  const [audio, setAudio] = useState<CoverrAudio | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [browseOpen, setBrowse] = useState(false);
  const [favorites, setFavorites] = useState<CoverrVideo[]>([]);
  const audioRef = useRef<AudioPlayerHandle>(null);

  useEffect(() => {
    setFavorites(storage.getFavorites());

    const savedVideo = storage.getSelected();
    if (savedVideo) {
      setVideo(savedVideo);
    } else {
      fetchRandomVideo()
        .then(v => { storage.setSelected(v); setVideo(v); })
        .catch(() => {});
    }

    const savedAudio = storage.getAudio();
    if (savedAudio) {
      setAudio(savedAudio);
    } else {
      fetchRandomAudio()
        .then(a => { if (a) { storage.setAudio(a); setAudio(a); } })
        .catch(() => {});
    }
  }, []);

  const selectVideo = async (v: CoverrVideo, userPicked = true) => {
    storage.setSelected(v);
    setVideo(v);
    setBrowse(false);
    if (userPicked) pingDownload(v.id).catch(() => {});
  };

  const handleFavorite = (v?: CoverrVideo) => {
    const target = v ?? video;
    if (!target) return;
    storage.toggleFavorite(target);
    setFavorites(storage.getFavorites());
  };

  if (!video) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const isFavorite = favorites.some(f => f.id === video.id);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fullscreen video */}
      <video
        key={video.id}
        src={video.urls.mp4}
        poster={video.poster}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Hidden audio player */}
      {audio && (
        <AudioPlayer
          ref={audioRef}
          audio={audio}
          onStateChange={setAudioPlaying}
        />
      )}

      {/* Overlay */}
      <SceneOverlay
        video={video}
        audioPlaying={audioPlaying}
        isFavorite={isFavorite}
        onBrowse={() => setBrowse(true)}
        onAudioToggle={() => audioRef.current?.toggle()}
        onVolumeChange={v => audioRef.current?.setVolume(v)}
        onFavorite={() => handleFavorite()}
      />

      {/* Browse drawer */}
      <BrowseDrawer
        open={browseOpen}
        favorites={favorites}
        onClose={() => setBrowse(false)}
        onSelect={v => selectVideo(v, true)}
        onFavorite={handleFavorite}
      />
    </div>
  );
}
