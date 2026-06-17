import {
  SILENT_DISCO_MID_TILE_H,
  SILENT_DISCO_MID_TILE_W,
  SILENT_DISCO_STATIC_VIEWPORT_W,
  SILENT_DISCO_STATIC_VIEWPORT_X,
  STATIC_SILENT_DISCO_SCENE_SHIFT_X,
} from './constants';

const SCENE_HREF = '/images/cities/silent-disco-scene.svg?v=6';

const STATIC_CLIP_ID = 'sd-static-viewport-clip';

type SilentDiscoTileProps = {
  /** Fixed-camera mode — backdrop covers the viewport slice only. */
  fitViewport?: boolean;
};

/** Silent Disco — dark-sky headphone rave grounds (stage overlays in front). */
export function SilentDiscoTile({ fitViewport = false }: SilentDiscoTileProps) {
  if (!fitViewport) {
    return (
      <image
        href={SCENE_HREF}
        x={0}
        y={0}
        width={SILENT_DISCO_MID_TILE_W}
        height={800}
        preserveAspectRatio="xMidYMax meet"
      />
    );
  }

  const vx = SILENT_DISCO_STATIC_VIEWPORT_X;
  const vw = SILENT_DISCO_STATIC_VIEWPORT_W;
  const vh = SILENT_DISCO_MID_TILE_H;

  return (
    <>
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <image
        href={SCENE_HREF}
        x={STATIC_SILENT_DISCO_SCENE_SHIFT_X}
        y={0}
        width={SILENT_DISCO_MID_TILE_W}
        height={800}
        preserveAspectRatio="xMidYMax slice"
        clipPath={`url(#${STATIC_CLIP_ID})`}
      />
    </>
  );
}
