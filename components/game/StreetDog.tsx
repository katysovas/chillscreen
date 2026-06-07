'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { dogsForTile } from '@/lib/streetDogs';

const SDG_CSS = `
  @keyframes sdg-head {
    0% { transform: rotate(0deg); }
    30% { transform: rotate(0deg); }
    40% { transform: rotate(-20deg); }
    80% { transform: rotate(-20deg); }
    90% { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
  }

  @keyframes sdg-tongue {
    0% { height: 10px; }
    30% { height: 10px; }
    40% { height: 20px; }
    60% { height: 10px; }
    80% { height: 20px; }
    90% { height: 10px; }
    100% { height: 10px; }
  }

  @keyframes sdg-tail {
    0% { transform: rotate(-47deg); }
    100% { transform: rotate(-57deg); }
  }

  .sdg-root {
    width: 200px;
    height: 220px;
    position: relative;
    pointer-events: none;
    transform-origin: center bottom;
  }

  .sdg-dog {
    width: 160px;
    height: 186px;
    position: relative;
    margin: 0 auto;
  }

  .sdg-head {
    width: 100px;
    height: 90px;
    position: absolute;
    z-index: 5;
    top: 30px;
    left: calc(50% - 50px);
    background-color: #efc092;
    border-radius: 50%;
    animation: sdg-head 6s linear infinite;
  }

  .sdg-head::before,
  .sdg-head::after {
    content: "";
    width: 79px;
    height: 50px;
    position: absolute;
    z-index: 5;
    top: 44px;
    background-color: #efc092;
    border-radius: 50%;
  }

  .sdg-head::before {
    left: -7px;
    transform: rotate(50deg);
  }

  .sdg-head::after {
    right: -7px;
    transform: rotate(-49deg);
  }

  .sdg-mouth {
    width: 60px;
    height: 35px;
    background-color: #fee2d2;
    position: absolute;
    bottom: -15px;
    left: 20px;
    z-index: 10;
    border-radius: 50%;
  }

  .sdg-mouth::after {
    content: "";
    width: 10px;
    height: 40px;
    background-color: #fee2d2;
    position: absolute;
    bottom: 30px;
    left: 24px;
    z-index: 10;
    border-radius: 20px;
  }

  .sdg-nose {
    width: 16px;
    height: 10px;
    position: absolute;
    top: 8px;
    left: calc(50% - 8px);
    background-color: #000;
    border-radius: 50%;
  }

  .sdg-tongue {
    width: 20px;
    height: 10px;
    position: absolute;
    top: 24px;
    left: calc(50% - 10px);
    background-color: #f4a4ad;
    border-radius: 0 0 10px 10px;
    animation: sdg-tongue 4s linear infinite;
  }

  .sdg-eyes {
    width: 10px;
    height: 16px;
    background-color: #000;
    position: absolute;
    top: 52px;
    left: 28px;
    border-radius: 50%;
    z-index: 10;
    box-shadow: 33px 0 0 #000;
  }

  .sdg-eyes::after {
    content: "";
    width: 92px;
    height: 50px;
    position: absolute;
    top: -50px;
    left: -24px;
    background-color: #efc092;
    border-radius: 50%;
  }

  .sdg-ears {
    width: 80px;
    height: 50px;
    position: absolute;
    z-index: 0;
    top: -2px;
    border-radius: 150px 0 150px 0;
    background-color: #efc092;
  }

  .sdg-ears::after {
    content: "";
    width: 50px;
    height: 30px;
    position: absolute;
    z-index: 0;
    top: 8px;
    left: 20px;
    border-radius: 150px 0 150px 0;
    transform: rotate(-176deg);
    background-color: #fee2d2;
  }

  .sdg-ears-left {
    left: -22px;
    transform: rotate(-105deg);
  }

  .sdg-ears-right {
    right: -22px;
    transform: rotate(-22deg);
  }

  .sdg-body {
    width: 54px;
    height: 60px;
    position: absolute;
    top: 120px;
    left: calc(50% - 35px);
    background-color: #d58b4e;
    border-radius: 49px 0 0 20px;
  }

  .sdg-body::before {
    content: "";
    width: 50px;
    height: 60px;
    position: absolute;
    top: 3px;
    left: calc(50% - 17px);
    background-color: #efbf8e;
    border-radius: 100px 100px 0 0;
  }

  .sdg-body::after {
    content: "";
    width: 15px;
    height: 30px;
    position: absolute;
    top: 32px;
    left: 28px;
    background-color: #d58b4e;
    border-radius: 100px 100px 0 0;
  }

  .sdg-foot {
    width: 20px;
    height: 13px;
    position: absolute;
    z-index: 5;
    bottom: -3px;
    left: 8px;
    background-color: #fce2d3;
    border-radius: 10px 10px 0 0;
    box-shadow: 33px 0 0 #fce2d3;
  }

  .sdg-tail {
    width: 10px;
    height: 50px;
    position: absolute;
    top: 120px;
    left: calc(50% - 45px);
    background-color: #ecc093;
    transform: rotate(-47deg);
    border-radius: 10px 0 0 0 / 50px 0 0 0;
    animation: sdg-tail 0.08s infinite alternate;
  }

  .sdg-ball {
    width: 30px;
    height: 30px;
    position: absolute;
    bottom: 0;
    right: 0;
    border-radius: 50%;
    background-color: var(--sdg-ball, #6E64F0);
  }
`;

let sdgStylesInjected = false;

function injectSdgStyles() {
  if (sdgStylesInjected || typeof document === 'undefined') return;
  sdgStylesInjected = true;
  const el = document.createElement('style');
  el.setAttribute('data-sdg', '');
  el.textContent = SDG_CSS;
  document.head.appendChild(el);
}

export type StreetDogProps = {
  scale?: number;
  flip?: boolean;
  ballColor?: string;
  className?: string;
};

/** Animated dog with ball — transparent background. */
export function StreetDog({ scale = 1, flip = false, ballColor = '#6E64F0', className }: StreetDogProps) {
  injectSdgStyles();

  const ballStyle = { '--sdg-ball': ballColor } as CSSProperties;

  return (
    <div
      className={className}
      style={{
        transform: `scale(${scale})${flip ? ' scaleX(-1)' : ''}`,
        transformOrigin: 'center bottom',
      }}
    >
      <div className="sdg-root" style={ballStyle}>
        <div className="sdg-dog">
          <div className="sdg-head">
            <div className="sdg-ears sdg-ears-left" />
            <div className="sdg-ears sdg-ears-right" />
            <div className="sdg-eyes" />
            <div className="sdg-mouth">
              <div className="sdg-nose" />
              <div className="sdg-tongue" />
            </div>
          </div>
          <div className="sdg-tail" />
          <div className="sdg-body">
            <div className="sdg-foot" />
          </div>
          <div className="sdg-ball" />
        </div>
      </div>
    </div>
  );
}

const ARTBOARD = 200;

/** One dog in ground SVG space — locked to sidewalk coords. */
export function StreetDogGroundMarker({
  x,
  gndY,
  scale,
  flip,
  ballColor,
}: {
  x: number;
  gndY: number;
  scale: number;
  flip: boolean;
  ballColor: string;
}) {
  injectSdgStyles();
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
          <StreetDog scale={1} ballColor={ballColor} />
        </div>
      </foreignObject>
    </g>
  );
}

/** Dogs on the sidewalk inside a ground tile — scrolls with GroundLayer SVG. */
export function StreetDogsGround({ tile, gndY, maxX }: { tile: number; gndY: number; maxX?: number }) {
  return (
    <>
      {dogsForTile(tile)
        .filter(dog => maxX === undefined || dog.x <= maxX)
        .map(dog => (
          <StreetDogGroundMarker
            key={dog.id}
            x={dog.x}
            gndY={gndY}
            scale={dog.scale}
            flip={dog.flip}
            ballColor={dog.ballColor}
          />
        ))}
    </>
  );
}
