'use client';

import { useEffect, useRef } from 'react';

const CIRCLE_COUNT = 48;

function drawStaticCircles(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < CIRCLE_COUNT; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 12 + Math.random() * 32;
    const color = `rgb(${Math.floor(Math.random() * 180)},${Math.floor(Math.random() * 60)},${Math.floor(Math.random() * 100)})`;

    ctx.fillStyle = color;
    ctx.shadowBlur = 40;
    ctx.shadowColor = color;
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
}

export function LandingHeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      drawStaticCircles(ctx, canvas.width, canvas.height);
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="hero-canvas-wrap" aria-hidden>
      <canvas ref={canvasRef} className="hero-canvas" />
    </div>
  );
}
