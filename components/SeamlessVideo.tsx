'use client';
import { useEffect, useRef, useState } from 'react';

const XFADE_SECS = 0.8;  // start crossfade this many seconds before end
const XFADE_MS   = 600;  // transition duration in ms

interface Props {
  src: string;
  poster?: string;
}

export default function SeamlessVideo({ src, poster }: Props) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(0); // 0 = A on top, 1 = B on top
  const activeRef   = useRef(0);   // which slot is currently playing
  const switchingRef = useRef(false);

  useEffect(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a || !b) return;

    const vids = [a, b];

    // Reset state when src changes
    switchingRef.current = false;
    activeRef.current = 0;
    setVisible(0);

    vids.forEach(v => { v.src = src; v.load(); });
    a.play().catch(() => {});

    const checkTime = () => {
      if (switchingRef.current) return;
      const cur = activeRef.current;
      const active = vids[cur];
      if (!active.duration) return;

      const remaining = active.duration - active.currentTime;
      if (remaining > XFADE_SECS) return;

      switchingRef.current = true;
      const next = 1 - cur;
      vids[next].currentTime = 0;
      vids[next].play().catch(() => {});
      activeRef.current = next;
      setVisible(next);

      // Once the crossfade is complete, reset the outgoing video
      setTimeout(() => {
        active.pause();
        active.currentTime = 0;
        switchingRef.current = false;
      }, XFADE_MS + 100);
    };

    a.addEventListener('timeupdate', checkTime);
    b.addEventListener('timeupdate', checkTime);

    return () => {
      a.removeEventListener('timeupdate', checkTime);
      b.removeEventListener('timeupdate', checkTime);
      a.pause();
      b.pause();
    };
  }, [src]);

  return (
    <>
      <video
        ref={refA}
        poster={poster}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity"
        style={{ opacity: visible === 0 ? 1 : 0, transitionDuration: `${XFADE_MS}ms` }}
      />
      <video
        ref={refB}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity"
        style={{ opacity: visible === 1 ? 1 : 0, transitionDuration: `${XFADE_MS}ms` }}
      />
    </>
  );
}
