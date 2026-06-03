'use client';
import { useEffect, useRef } from 'react';

// How many seconds before end to start the next video (hidden), giving the
// decoder time to render its first frame before it becomes visible.
const PRE_WARM_SECS = 2.0;
// How many seconds before end to begin the opacity crossfade.
const XFADE_SECS = 0.6;
// Duration of the opacity transition in milliseconds.
const XFADE_MS = 500;

interface Props {
  src: string;
  poster?: string;
}

export default function SeamlessVideo({ src, poster }: Props) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a || !b) return;
    const vids = [a, b];

    let activeSlot = 0;       // which slot is the current visible video
    let preWarming = false;   // next video has started playing (hidden)
    let switching  = false;   // crossfade in progress

    // Reset visual state immediately (no transition)
    const setOpacity = (el: HTMLVideoElement, val: number, animated: boolean) => {
      el.style.transition = animated ? `opacity ${XFADE_MS}ms ease-in-out` : 'none';
      el.style.opacity = String(val);
    };

    setOpacity(a, 1, false);
    setOpacity(b, 0, false);

    // Load both with same src; browser reuses cached data for the second one
    vids.forEach(v => { v.src = src; v.load(); });
    a.play().catch(() => {});

    const onTimeUpdate = () => {
      const active = vids[activeSlot];
      const next   = vids[1 - activeSlot];
      if (!active.duration) return;

      const remaining = active.duration - active.currentTime;

      // Step 1: pre-warm — start next video playing but invisible
      if (!preWarming && !switching && remaining <= PRE_WARM_SECS) {
        preWarming = true;
        next.currentTime = 0;
        setOpacity(next, 0, false);   // ensure hidden
        next.play().catch(() => {});
      }

      // Step 2: crossfade — swap opacity once decoder has warmed up
      if (!switching && remaining <= XFADE_SECS) {
        switching = true;
        const outgoing = active;
        const incoming = next;
        const prevSlot = activeSlot;
        activeSlot = 1 - prevSlot;

        setOpacity(outgoing, 0, true);
        setOpacity(incoming, 1, true);

        setTimeout(() => {
          outgoing.pause();
          outgoing.currentTime = 0;
          setOpacity(outgoing, 0, false); // reset without animation
          preWarming = false;
          switching  = false;
        }, XFADE_MS + 150);
      }
    };

    a.addEventListener('timeupdate', onTimeUpdate);
    b.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      a.removeEventListener('timeupdate', onTimeUpdate);
      b.removeEventListener('timeupdate', onTimeUpdate);
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
        className="absolute inset-0 w-full h-full object-cover"
      />
      <video
        ref={refB}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </>
  );
}
