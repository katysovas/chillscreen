'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { CoverrAudio } from '@/lib/types';
import { storage } from '@/lib/storage';

export type AudioPlayerHandle = {
  toggle: () => void;
  setVolume: (v: number) => void;
  isPlaying: () => boolean;
};

interface Props {
  audio: CoverrAudio;
  onStateChange: (playing: boolean) => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(({ audio, onStateChange }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRef = useRef(false);
  const gestureRef = useRef(false);

  useImperativeHandle(ref, () => ({
    toggle: () => {
      if (!audioRef.current) return;
      if (playingRef.current) {
        audioRef.current.pause();
        playingRef.current = false;
        storage.setAudioOn(false);
        onStateChange(false);
      } else {
        audioRef.current.play().then(() => {
          playingRef.current = true;
          storage.setAudioOn(true);
          onStateChange(true);
        }).catch(() => {});
      }
    },
    setVolume: (v: number) => {
      if (audioRef.current) audioRef.current.volume = v;
    },
    isPlaying: () => playingRef.current,
  }));

  // Enable audio after first user gesture (browser autoplay policy)
  useEffect(() => {
    const enable = () => {
      if (gestureRef.current) return;
      gestureRef.current = true;
      if (storage.isAudioOn() && audioRef.current) {
        audioRef.current.play().then(() => {
          playingRef.current = true;
          onStateChange(true);
        }).catch(() => {});
      }
    };
    document.addEventListener('click', enable, { once: true });
    document.addEventListener('touchend', enable, { once: true });
    return () => {
      document.removeEventListener('click', enable);
      document.removeEventListener('touchend', enable);
    };
  }, [onStateChange]);

  return (
    <audio
      ref={audioRef}
      src={audio.urls.preview}
      loop
      preload="none"
      style={{ display: 'none' }}
    />
  );
});

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
