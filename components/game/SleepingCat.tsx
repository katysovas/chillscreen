'use client';

import type { HTMLAttributes } from 'react';
import { catsForTile } from '@/lib/sleepingCats';

const DURATION = '12s';

const SLC_CSS = `
  @keyframes slc-tail {
    6.667% { transform: rotate(0); }
    10% { transform: rotate(10deg); }
    16.667% { transform: rotate(-5deg); }
    20% { transform: rotate(30deg); }
    26.667% { transform: rotate(-2deg); }
    46.667% { transform: rotate(10deg); }
    53.333% { transform: rotate(-5deg); }
    56.667% { transform: rotate(10deg); }
  }

  @keyframes slc-body {
    6.667% { transform: scaleY(1); }
    10% { transform: scaleY(1.15); }
    16.667% { transform: scaleY(1); }
    20% { transform: scaleY(1.25); }
    26.667% { transform: scaleY(1); }
    46.667% { transform: scaleY(1.15); }
    53.333% { transform: scaleY(1); }
    56.667% { transform: scaleY(1.15); }
  }

  @keyframes slc-left-whisker {
    6.667% { transform: rotate(0); }
    10% { transform: rotate(0deg); }
    16.667% { transform: rotate(-5deg); }
    20% { transform: rotate(0deg); }
    26.667% { transform: rotate(0deg); }
    46.667% { transform: rotate(10deg); }
    53.333% { transform: rotate(-5deg); }
    56.667% { transform: rotate(10deg); }
  }

  @keyframes slc-right-whisker {
    6.667% { transform: rotate(180deg); }
    10% { transform: rotate(190deg); }
    16.667% { transform: rotate(180deg); }
    20% { transform: rotate(175deg); }
    26.667% { transform: rotate(190deg); }
    46.667% { transform: rotate(180deg); }
    53.333% { transform: rotate(185deg); }
    56.667% { transform: rotate(175deg); }
  }

  @keyframes slc-left-ear {
    0% { transform: rotate(-20deg); }
    6.667% { transform: rotate(-6deg); }
    13.333% { transform: rotate(-15deg); }
    26.667% { transform: rotate(-15deg); }
    33.333% { transform: rotate(-30deg); }
    40% { transform: rotate(-30deg); }
    46.667% { transform: rotate(0deg); }
    53.333% { transform: rotate(0deg); }
    60% { transform: rotate(-15deg); }
    80% { transform: rotate(-15deg); }
    93.333% { transform: rotate(-6deg); }
    100% { transform: rotateZ(-6deg); }
  }

  @keyframes slc-right-ear {
    0% { transform: rotateZ(-16deg); }
    6.667% { transform: rotateZ(-16deg); }
    13.333% { transform: rotateZ(-19deg); }
    26.667% { transform: rotateZ(-19deg); }
    33.333% { transform: rotateZ(-30deg); }
    36.667% { transform: rotateZ(-19deg); }
    37.333% { transform: rotateZ(-30deg); }
    38% { transform: rotateZ(-19deg); }
    40% { transform: rotateZ(-19deg); }
    40.667% { transform: rotateZ(-30deg); }
    41.333% { transform: rotateZ(-19deg); }
    46.667% { transform: rotateZ(-9deg); }
    53.333% { transform: rotateZ(-9deg); }
    60% { transform: rotateZ(-19deg); }
    60.667% { transform: rotateZ(-30deg); }
    61.333% { transform: rotateZ(-19deg); }
    62.667% { transform: rotateZ(-19deg); }
    63.333% { transform: rotateZ(-30deg); }
    64% { transform: rotateZ(-19deg); }
    80% { transform: rotateZ(-19deg); }
    93.333% { transform: rotateZ(-16deg); }
    100% { transform: rotateZ(-16deg); }
  }

  .slc-root {
    width: 400px;
    height: 400px;
    position: relative;
    pointer-events: none;
    transform-origin: center bottom;
  }

  .slc-stand {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%);
    height: 20px;
    width: 200px;
    border-radius: 20px;
    background-color: #fd6e72;
    z-index: 2;
  }

  .slc-stand::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translate(-50%);
    height: 10px;
    width: 50px;
    border-radius: 20px;
    background-color: #fdf9de;
    box-shadow:
      0 10px 0 #fdf9de,
      0 20px 0 #fdf9de,
      0 30px 0 #fdf9de,
      0 40px 0 #fdf9de,
      0 50px 0 #fdf9de,
      0 60px 0 #fdf9de,
      0 70px 0 #fdf9de,
      0 80px 0 #fdf9de,
      0 90px 0 #fdf9de,
      0 100px 0 #fdf9de,
      0 110px 0 #fdf9de,
      0 120px 0 #fdf9de,
      0 130px 0 #fdf9de,
      0 140px 0 #fdf9de,
      0 150px 0 #fdf9de,
      0 160px 0 #fdf9de,
      0 170px 0 #fdf9de;
  }

  .slc-cat {
    width: 110px;
    height: 50px;
    position: absolute;
    top: calc(50% - 50px);
    right: 130px;
    border-top-left-radius: 100px;
    border-top-right-radius: 100px;
  }

  .slc-body {
    width: 110px;
    height: 50px;
    background-color: #745260;
    position: absolute;
    border-top-left-radius: 100px;
    border-top-right-radius: 100px;
    animation: slc-body ${DURATION} none infinite;
  }

  .slc-head {
    width: 70px;
    height: 35px;
    background-color: #745260;
    position: absolute;
    top: calc(50% - 10px);
    left: -40px;
    border-top-left-radius: 80px;
    border-top-right-radius: 80px;
  }

  .slc-face {
    position: absolute;
    top: calc(50% - 10px);
    left: -40px;
    width: 70px;
    height: 35px;
    pointer-events: none;
  }

  .slc-nose {
    position: absolute;
    bottom: 10px;
    left: -8px;
    background-color: #fd6e72;
    height: 4px;
    width: 4px;
    border-radius: 50%;
  }

  .slc-whisker-container {
    position: absolute;
    bottom: 8px;
    left: -18px;
    width: 12px;
    height: 8px;
    transform-origin: right center;
    animation: slc-left-whisker ${DURATION} both infinite;
  }

  .slc-whisker-container:last-child {
    left: -4px;
    bottom: 10px;
    width: 10px;
    height: 7px;
    transform-origin: left center;
    transform: rotate(180deg);
    animation: slc-right-whisker ${DURATION} both infinite;
  }

  .slc-whisker {
    position: absolute;
    right: 0;
    width: 100%;
    height: 0;
    border: none;
    border-top: 0.5px solid #fdf9de;
    transform-origin: right center;
    transform: rotate(7deg);
  }

  .slc-whisker:last-child {
    top: 5px;
    transform: rotate(-11deg);
  }

  .slc-tail-container {
    position: absolute;
    right: 0;
    bottom: -13px;
    z-index: 3;
  }

  .slc-tail {
    position: absolute;
    height: 30px;
    width: 14px;
    bottom: -10px;
    right: 0;
    border-bottom-right-radius: 5px;
    background: #745260;
    z-index: 0;
  }

  .slc-tail > .slc-tail {
    animation: slc-tail ${DURATION} none infinite;
    height: 100%;
    width: 14px;
    transform-origin: left;
    border-bottom-left-radius: 20px 20px;
    border-bottom-right-radius: 20px 20px;
    border-top-right-radius: 40px;
  }

  .slc-ear {
    position: absolute;
    left: 4px;
    top: -4px;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 20px solid #745260;
    transform: rotate(-30deg);
    animation: slc-left-ear ${DURATION} both infinite;
  }

  .slc-ear + .slc-ear {
    animation: slc-right-ear ${DURATION} both infinite;
    top: -12px;
    left: 30px;
  }
`;

let slcStylesInjected = false;

function injectSlcStyles() {
  if (slcStylesInjected || typeof document === 'undefined') return;
  slcStylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-slc', '');
  el.textContent = SLC_CSS;
  document.head.appendChild(el);
}

function TailSegments({ depth }: { depth: number }) {
  if (depth <= 0) return null;
  return (
    <div className="slc-tail">
      <TailSegments depth={depth - 1} />
    </div>
  );
}

export type SleepingCatProps = {
  scale?: number;
  flip?: boolean;
  className?: string;
};

/** Animated sleeping cat on a bench — transparent background. */
export function SleepingCat({ scale = 0.32, flip = false, className }: SleepingCatProps) {
  injectSlcStyles();

  return (
    <div
      className={className}
      style={{
        transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: 'center bottom',
      }}
    >
      <div className="slc-root">
        <span className="slc-stand" aria-hidden />
        <div className="slc-cat">
          <div className="slc-body" />
          <div className="slc-head">
            <div className="slc-ear" />
            <div className="slc-ear" />
          </div>
          <div className="slc-face">
            <div className="slc-nose" />
            <div className="slc-whisker-container">
              <div className="slc-whisker" />
              <div className="slc-whisker" />
            </div>
            <div className="slc-whisker-container">
              <div className="slc-whisker" />
              <div className="slc-whisker" />
            </div>
          </div>
          <div className="slc-tail-container">
            <TailSegments depth={7} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ARTBOARD = 400;

/** One cat in ground SVG space — locked to sidewalk coords (same as trees). */
export function SleepingCatGroundMarker({
  x,
  gndY,
  scale,
  flip,
}: {
  x: number;
  gndY: number;
  scale: number;
  flip: boolean;
}) {
  injectSlcStyles();
  const sx = flip ? -scale : scale;

  return (
    <g transform={`translate(${x}, ${gndY}) scale(${sx}, ${scale})`}>
      <foreignObject
        x={-ARTBOARD / 2}
        y={-ARTBOARD}
        width={ARTBOARD}
        height={ARTBOARD}
        style={{ overflow: 'visible' }}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{ width: ARTBOARD, height: ARTBOARD }}
        >
          <SleepingCat scale={1} />
        </div>
      </foreignObject>
    </g>
  );
}

/** Cats beside trees inside a ground tile — scrolls with GroundLayer SVG. */
export function SleepingCatsGround({ tile, gndY }: { tile: number; gndY: number }) {
  return (
    <>
      {catsForTile(tile).map(cat => (
        <SleepingCatGroundMarker
          key={cat.id}
          x={cat.x}
          gndY={gndY}
          scale={cat.scale}
          flip={cat.flip}
        />
      ))}
    </>
  );
}
