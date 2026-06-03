'use client';
import { useEffect, useRef } from 'react';

// How early (in seconds) to start the next video playing (hidden from canvas)
// so its decoder is warm when we need it.
const PRE_WARM_SECS = 3.0;
// How early (in seconds) to actually switch the canvas to paint from next video.
const SWITCH_SECS = 0.1;

function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  cw: number,
  ch: number
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(cw / vw, ch / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

interface Props {
  src: string;
  poster?: string;
}

export default function SeamlessVideo({ src }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const a = refA.current;
    const b = refB.current;
    if (!canvas || !a || !b) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mutable loop state (never stale — not closed over React state)
    let active = a;
    let next   = b;
    let rafId: number;
    let preWarmed = false;
    let switched  = false;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = () => {
      const cw = canvas.width;
      const ch = canvas.height;

      // Paint current frame.
      // Canvas retains its last pixels if we skip a draw — no black ever shown.
      if (active.readyState >= 2) {
        drawCover(ctx, active, cw, ch);
      }

      const dur = active.duration;
      if (dur && dur > 0) {
        const remaining = dur - active.currentTime;

        // Pre-warm: start next video running (off-canvas) so decoder is ready
        if (!preWarmed && remaining <= PRE_WARM_SECS) {
          preWarmed = true;
          next.currentTime = 0;
          next.play().catch(() => {});
        }

        // Switch: swap which video we paint from (instantly — canvas has last frame as fallback)
        if (!switched && remaining <= SWITCH_SECS) {
          switched = true;
          const outgoing = active;
          active = next;
          next   = outgoing;

          // Clean up outgoing after a brief moment
          setTimeout(() => {
            outgoing.pause();
            outgoing.currentTime = 0;
            preWarmed = false;
            switched  = false;
          }, 300);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    // Load both videos (same URL → browser reuses cached data for second one)
    [a, b].forEach(v => { v.src = src; v.load(); });
    a.play().catch(() => {});
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      a.pause();
      b.pause();
    };
  }, [src]);

  return (
    <>
      {/* Both video elements are invisible — canvas is the only visible surface */}
      <video ref={refA} muted playsInline preload="auto" className="hidden" />
      <video ref={refB} muted playsInline preload="auto" className="hidden" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </>
  );
}
