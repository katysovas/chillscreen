'use client';

import {
  galleryOptionMatches,
  isCustomCityGalleryBackdrop,
  STAGE_GALLERY_OPTIONS,
  type StageGalleryOption,
} from '@/lib/stages/stageGallery';
import type { StagePresetId } from '@/lib/stages/types';

export type StageGallerySelection = {
  preset: StagePresetId;
  backdropUrl: string | null;
};

type Props = {
  preset: StagePresetId;
  backdropUrl?: string | null;
  onChange: (selection: StageGallerySelection) => void;
  disabled?: boolean;
  compact?: boolean;
  /** Fixed column count — otherwise auto-fill by min tile width. */
  columns?: number;
  /** Scroll area height — defaults taller when upload tile is shown. */
  maxHeight?: number;
  /** First grid tile — opens custom backdrop upload (settings modal). */
  onUploadClick?: () => void;
  uploadLabel?: string;
};

const thumbHeight = (compact: boolean, expanded: boolean) => {
  if (expanded) return 64;
  return compact ? 48 : 56;
};

export function StageSceneGallery({
  preset,
  backdropUrl = null,
  onChange,
  disabled = false,
  compact = false,
  columns,
  maxHeight,
  onUploadClick,
  uploadLabel = 'Upload',
}: Props) {
  const customCityBackdrop = isCustomCityGalleryBackdrop(preset, backdropUrl);
  const expanded = Boolean(onUploadClick);
  const thumbH = thumbHeight(compact, expanded);
  const scrollMaxHeight = maxHeight ?? (expanded ? (columns && columns >= 4 ? 420 : 700) : compact ? 280 : 320);

  const pick = (option: StageGalleryOption) => {
    onChange({
      preset: option.preset,
      backdropUrl: option.preset === 'cinema' ? option.backdropUrl : null,
    });
  };

  const uploadTile = onUploadClick ? (
    <button
      key="upload"
      type="button"
      disabled={disabled}
      title={uploadLabel}
      aria-label={uploadLabel}
      onClick={onUploadClick}
      style={{
        borderRadius: 10,
        padding: 0,
        overflow: 'hidden',
        border: customCityBackdrop
          ? '2px solid rgba(126,184,255,0.85)'
          : '1px dashed rgba(126,184,255,0.45)',
        background: customCityBackdrop
          ? 'rgba(126,184,255,0.12)'
          : 'rgba(126,184,255,0.06)',
        color: customCityBackdrop ? '#dcecff' : 'rgba(184,217,255,0.9)',
        cursor: disabled ? 'wait' : 'pointer',
        textAlign: 'center',
        boxShadow: customCityBackdrop ? '0 0 0 1px rgba(126,184,255,0.2)' : 'none',
      }}
    >
      {customCityBackdrop && backdropUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdropUrl}
          alt=""
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            height: thumbH,
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: thumbH,
            fontSize: 28,
            fontWeight: 300,
            lineHeight: 1,
            color: 'rgba(184,217,255,0.75)',
          }}
          aria-hidden
        >
          +
        </div>
      )}
      <div style={{
        padding: compact ? '5px 4px' : '6px 4px',
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      >
        {customCityBackdrop ? 'Custom' : uploadLabel}
      </div>
    </button>
  ) : null;

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Stage scene"
        style={{
          display: 'grid',
          gridTemplateColumns: columns
            ? `repeat(${columns}, minmax(0, 1fr))`
            : expanded
              ? 'repeat(auto-fill, minmax(96px, 1fr))'
              : 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: compact ? 6 : 8,
          maxHeight: scrollMaxHeight,
          overflowY: 'auto',
          paddingRight: 2,
          scrollbarWidth: 'thin',
        }}
      >
        {uploadTile}
        {STAGE_GALLERY_OPTIONS.map(option => {
          const active = galleryOptionMatches(option, preset, backdropUrl);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              title={option.tagline ? `${option.label} — ${option.tagline}` : option.label}
              onClick={() => pick(option)}
              style={{
                borderRadius: 10,
                padding: 0,
                overflow: 'hidden',
                border: active
                  ? '2px solid rgba(111,207,151,0.85)'
                  : '1px solid rgba(255,255,255,0.12)',
                background: active ? 'rgba(111,207,151,0.14)' : 'rgba(255,255,255,0.04)',
                color: active ? '#eafff6' : 'rgba(255,255,255,0.82)',
                cursor: disabled ? 'wait' : 'pointer',
                textAlign: 'center',
                boxShadow: active ? '0 0 0 1px rgba(111,207,151,0.2)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={option.thumbSrc}
                alt=""
                draggable={false}
                style={{
                  display: 'block',
                  width: '100%',
                  height: thumbH,
                  objectFit: 'cover',
                }}
              />
              <div style={{
                padding: compact ? '5px 4px' : '6px 4px',
                fontSize: compact ? 10 : expanded ? 11 : 11,
                fontWeight: 600,
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              >
                {option.label}
              </div>
            </button>
          );
        })}
      </div>

      {customCityBackdrop && !onUploadClick && (
        <p style={{
          margin: '8px 0 0',
          fontSize: 11,
          lineHeight: 1.4,
          color: 'rgba(255,255,255,0.55)',
        }}
        >
          Using your custom City upload. Pick a scene above to switch back.
        </p>
      )}
    </div>
  );
}
