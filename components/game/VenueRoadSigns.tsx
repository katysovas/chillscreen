import {
  CINEMA_SIGN_MID_X,
  CONCERT_SIGN_MID_X,
  MID_TILE,
  VIEW_CENTER_X,
  cinemaMidX,
  concertLabel,
  concertMidX,
} from '@/lib/venues';
import { citySignsForTile } from '@/lib/citySigns';
import {
  isSanFranciscoTile,
  isSeattleTile,
  isSouthernCaliforniaTile,
  isVegasTile,
} from '@/lib/worldTiles';
import { MID_F } from '@/lib/parallax';
import { gndOriginForTile, midOriginForTile } from '@/lib/worldTileGeometry';
import { COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';
import { EDC_STAGE_MID_X } from '@/components/game/city/lasvegas/constants';
import { ArrowSignBoard, SignPost } from './city/ArrowSignBoard';

/** Ground-tile x — locked to sidewalk scroll (GND_F). */
export function venueSignGroundX(midX: number, groundTile: number) {
  return Math.round((midX / MID_TILE) * groundTile);
}

export function concertSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CONCERT_SIGN_MID_X, groundTile);
}

export function cinemaSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CINEMA_SIGN_MID_X, groundTile);
}

export type StreetSignProps = {
  x: number;
  y: number;
  dir: 'left' | 'right';
  label: string;
  accent: string;
  icon: string;
};

const ARROW_HALF_LEN = 58;
const ARROW_HALF_H = 19;
const ARROW_TIP_LEN = 17;
const WING_OFFSET = ARROW_HALF_LEN + 16;

export function StreetSign({ x, y, dir, label, accent, icon }: StreetSignProps) {
  const basePostH = 28;
  const arrowCy = -basePostH - ARROW_HALF_H - 2;
  const postTop = arrowCy - ARROW_HALF_H - 6;
  const postH = -postTop;
  const wingX = dir === 'left' ? -WING_OFFSET : WING_OFFSET;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={WING_OFFSET + 12} ry={7} fill="rgba(0,0,0,.22)" />

      <SignPost
        postTop={postTop}
        postH={postH}
        armCy={arrowCy}
        armDir={dir}
        wingOffset={WING_OFFSET}
        arrowHalfLen={ARROW_HALF_LEN}
      />

      <g transform={`translate(${wingX},0)`}>
        <ArrowSignBoard
          cy={arrowCy}
          dir={dir}
          label={label}
          icon={icon}
          accent={accent}
          halfLen={ARROW_HALF_LEN}
          halfH={ARROW_HALF_H}
          tipLen={ARROW_TIP_LEN}
        />
      </g>
    </g>
  );
}

type CombinedTownSignProps = {
  x: number;
  y: number;
  leftCity: { label: string; icon: string; accent: string };
  rightCity: { label: string; icon: string; accent: string };
};

/** Trail junction — left/right arrow wings on one post (same shape as welcome sign). */
function CombinedTownSign({ x, y, leftCity, rightCity }: CombinedTownSignProps) {
  const basePostH = 30;
  const arrowHalfLen = 62;
  const arrowHalfH = 20;
  const arrowTipLen = 18;
  const rowH = arrowHalfH * 2 + 4;
  const rowGap = 14;
  const wingOffset = arrowHalfLen + 18;

  const lowerCy = -basePostH - arrowHalfH - 2;
  const upperCy = lowerCy - rowH - rowGap;
  const postTop = upperCy - arrowHalfH - 6;
  const postH = -postTop;

  const postW = 8;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={wingOffset + 14} ry={7} fill="rgba(0,0,0,.22)" />

      <rect x={-postW / 2} y={postTop} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect
        x={-postW / 2 + 1}
        y={postTop}
        width={postW - 2}
        height={postH - 2}
        rx={1.5}
        fill="#8a6b4f"
      />
      <line
        x1={0}
        y1={postTop + 6}
        x2={0}
        y2={-4}
        stroke="#6b5344"
        strokeWidth={1}
        opacity={0.45}
      />
      <circle cx={0} cy={postTop + 2} r={3} fill="#6b5344" stroke="#3a342c" strokeWidth={0.8} />
      <line
        x1={-postW / 2}
        y1={upperCy}
        x2={-wingOffset + arrowHalfLen}
        y2={upperCy}
        stroke="#6b5344"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={postW / 2}
        y1={lowerCy}
        x2={wingOffset - arrowHalfLen}
        y2={lowerCy}
        stroke="#6b5344"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <g transform={`translate(${-wingOffset},0)`}>
        <ArrowSignBoard
          cy={upperCy}
          dir="left"
          label={leftCity.label}
          icon={leftCity.icon}
          accent={leftCity.accent}
          halfLen={arrowHalfLen}
          halfH={arrowHalfH}
          tipLen={arrowTipLen}
        />
      </g>
      <g transform={`translate(${wingOffset},0)`}>
        <ArrowSignBoard
          cy={lowerCy}
          dir="right"
          label={rightCity.label}
          icon={rightCity.icon}
          accent={rightCity.accent}
          halfLen={arrowHalfLen}
          halfH={arrowHalfH}
          tipLen={arrowTipLen}
        />
      </g>
    </g>
  );
}

type TileRoadSignsProps = {
  tileIndex: number;
  y: number;
  groundTile?: number;
};

/**
 * Walk-direction-accurate venue sign.
 *
 * Signs live on the GROUND layer (parallax 1.0) but venues live on the MID
 * layer (parallax 0.35), so comparing their on-screen x positions gives the
 * wrong answer. The only coordinate both share is `worldOff` (the master
 * travel offset). We compute the worldOff at which the venue centers vs. the
 * worldOff at which the sign centers; if the venue centers further right
 * (larger worldOff) the player must walk right, otherwise left. This is correct
 * no matter which side the player approaches from.
 */
function VenueArrowSign({
  tileIndex,
  venueMidX,
  label,
  accent,
  icon,
  groundTile,
  y,
}: {
  tileIndex: number;
  venueMidX: number;
  label: string;
  accent: string;
  icon: string;
  groundTile: number;
  y: number;
}) {
  const venueGround = venueSignGroundX(venueMidX, groundTile);
  const signX = Math.min(Math.max(90, venueGround - 300), groundTile - 700);

  const worldOffVenueCenters =
    (midOriginForTile(tileIndex) + venueMidX - VIEW_CENTER_X) / MID_F;
  const worldOffSignCenters =
    gndOriginForTile(tileIndex) + signX - VIEW_CENTER_X;
  const dir: 'left' | 'right' =
    worldOffVenueCenters >= worldOffSignCenters ? 'right' : 'left';

  return <StreetSign x={signX} y={y} dir={dir} label={label} accent={accent} icon={icon} />;
}

/** City direction signs + venue signs (only in their home city). */
export function TileRoadSigns({ tileIndex, y, groundTile = 3600 }: TileRoadSignsProps) {
  const citySigns = citySignsForTile(tileIndex);

  return (
    <g className="road-signs">
      {citySigns.map((sign, i) =>
        sign.type === 'combined' ? (
          <CombinedTownSign
            key={`city-${i}`}
            x={Math.round(sign.xFrac * groundTile)}
            y={y}
            leftCity={sign.leftCity}
            rightCity={sign.rightCity}
          />
        ) : (
          <StreetSign
            key={`city-${i}`}
            x={Math.round(sign.xFrac * groundTile)}
            y={y}
            dir={sign.dir}
            label={sign.label}
            accent={sign.accent}
            icon={sign.icon}
          />
        ),
      )}
      {isSeattleTile(tileIndex) && concertMidX(tileIndex) != null && (
        <VenueArrowSign
          tileIndex={tileIndex}
          venueMidX={concertMidX(tileIndex)!}
          label={concertLabel(tileIndex) ?? 'Seattle Concerts'}
          accent="#1a9a52"
          icon="♪"
          groundTile={groundTile}
          y={y}
        />
      )}
      {isSanFranciscoTile(tileIndex) && (
        <>
          {concertMidX(tileIndex) != null && (
            <VenueArrowSign
              tileIndex={tileIndex}
              venueMidX={concertMidX(tileIndex)!}
              label={concertLabel(tileIndex) ?? 'Outside Hands'}
              accent="#1a9a52"
              icon="♪"
              groundTile={groundTile}
              y={y}
            />
          )}
          <VenueArrowSign
            tileIndex={tileIndex}
            venueMidX={cinemaMidX(tileIndex) ?? CINEMA_SIGN_MID_X}
            label="Cinema"
            accent="#b8860b"
            icon="🎬"
            groundTile={groundTile}
            y={y}
          />
        </>
      )}
      {isSouthernCaliforniaTile(tileIndex) && (
        <VenueArrowSign
          tileIndex={tileIndex}
          venueMidX={COACHELLA_STAGE_MID_X}
          label="Couchella"
          accent="#e85074"
          icon="🎡"
          groundTile={groundTile}
          y={y}
        />
      )}
      {isVegasTile(tileIndex) && (
        <VenueArrowSign
          tileIndex={tileIndex}
          venueMidX={EDC_STAGE_MID_X}
          label="Electric Daze"
          accent="#00e5ff"
          icon="🦉"
          groundTile={groundTile}
          y={y}
        />
      )}
    </g>
  );
}

/** @deprecated Use TileRoadSigns per tile — kept for tests / imports. */
export function VenueRoadSigns({
  y,
  concertX,
  cinemaX,
  groundTile = 3600,
}: {
  y: number;
  concertX?: number;
  cinemaX?: number;
  groundTile?: number;
}) {
  const cX = concertX ?? concertSignGroundX(groundTile);
  const mX = cinemaX ?? cinemaSignGroundX(groundTile);
  return (
    <g className="venue-road-signs">
      <StreetSign x={cX} y={y} dir="left" label="Concert" accent="#1a9a52" icon="♪" />
      <StreetSign x={mX} y={y} dir="right" label="Cinema" accent="#b8860b" icon="🎬" />
    </g>
  );
}
