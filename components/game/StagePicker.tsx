'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  currentStagePickerTarget,
  stagePickerTargetId,
  stagePickerTargetFromId,
  type StagePickerTarget,
} from '@/lib/stagePickerOptions';
import { FeaturedStagesChart } from '@/components/stages/FeaturedStagesChart';
import { SwitchStagesChart } from '@/components/stages/SwitchStagesChart';
import { chartEntryId, getFeaturedStagesChartTab } from '@/lib/stages/featuredStagesChart';
import {
  isValidPlayerName,
  sanitizePlayerNameInput,
} from '@/lib/playerStorage';
import { LOGO_PATH } from '@/lib/site';
import type { VenueRoute } from '@/lib/venueRoutes';

type Props = {
  balloonColor?: string;
  initialRoute?: VenueRoute | null;
  /** When viewing a creator stage — used to highlight the current pick. */
  creatorSlug?: string | null;
  requireName?: boolean;
  /** Home page copy — slightly different from in-game swap. */
  variant?: 'home' | 'swap';
  muted?: boolean;
  onToggleMute?: () => void;
  onEnter: (name: string, target: StagePickerTarget) => void;
  onClose?: () => void;
  initialName?: string;
};

/**
 * Full-screen city / stage picker — home entry, welcome flow, and in-game swap.
 */
export function StagePicker({
  initialRoute,
  creatorSlug = null,
  requireName = true,
  variant = 'home',
  muted,
  onToggleMute,
  onEnter,
  onClose,
  initialName,
}: Props) {
  const [draft, setDraft] = useState(initialName ?? '');
  const currentTarget = useMemo(
    () => currentStagePickerTarget(initialRoute, creatorSlug),
    [initialRoute, creatorSlug],
  );
  const currentId = currentTarget ? stagePickerTargetId(currentTarget) : null;
  const [pickedId, setPickedId] = useState<string | null>(currentId);
  const chartEntries = useMemo(() => getFeaturedStagesChartTab().entries, []);

  const validName = !requireName || isValidPlayerName(draft);
  const isSwap = variant === 'swap';

  useEffect(() => {
    if (initialName) setDraft(initialName);
  }, [initialName]);

  const pickedTarget = useMemo(() => {
    if (!pickedId) return null;
    const fromChart = chartEntries.find(e => chartEntryId(e) === pickedId);
    if (fromChart) return fromChart.target;
    return stagePickerTargetFromId(pickedId);
  }, [chartEntries, pickedId]);

  const sameAsCurrent = pickedTarget != null && currentTarget != null
    && stagePickerTargetId(pickedTarget) === stagePickerTargetId(currentTarget);

  const submit = () => {
    const name = draft.trim();
    if (requireName && !isValidPlayerName(name)) return;
    if (!pickedTarget) return;
    onEnter(name, pickedTarget);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.42)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))',
        overflowY: 'auto',
      }}
      onClick={isSwap && onClose ? onClose : undefined}
    >
      {!isSwap && onToggleMute && (
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute stage audio' : 'Mute stage audio'}
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top))',
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: muted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
            fontSize: 18,
            cursor: 'pointer',
            zIndex: 1001,
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: isSwap ? '#131415' : 'rgb(13,1,34)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '28px 20px 24px',
          maxWidth: 720,
          width: '100%',
          fontFamily: "Georgia,'Times New Roman',serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          position: 'relative',
        }}
      >
        {isSwap && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              fontFamily: 'system-ui,sans-serif',
            }}
          >
            ×
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt="WhichStage"
          style={{ display: 'block', height: 40, margin: '0 auto 14px', objectFit: 'contain' }}
        />

        {!isSwap && (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 6 }}>
              Pick your stage
            </div>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.62)',
                textAlign: 'center',
                fontFamily: 'system-ui,sans-serif',
              }}
            >
              Choose a city to explore. Watch live shows and chat with friends.
            </p>
          </>
        )}

        {isSwap ? (
          <SwitchStagesChart
            selectedId={pickedId}
            currentId={currentId}
            onSelect={target => setPickedId(stagePickerTargetId(target))}
          />
        ) : (
          <FeaturedStagesChart
            variant="modal"
            selectedId={pickedId}
            currentId={currentId}
            onSelect={target => setPickedId(stagePickerTargetId(target))}
          />
        )}

        {requireName && (
          <>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
                margin: '18px 0 8px',
                fontFamily: 'system-ui,sans-serif',
              }}
            >
              Your name
            </label>
            <input
              type="text"
              value={draft}
              maxLength={24}
              placeholder="What should we call you?"
              autoComplete="nickname"
              onChange={e => setDraft(sanitizePlayerNameInput(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 16,
                fontFamily: 'system-ui,sans-serif',
                marginBottom: 16,
                outline: 'none',
              }}
            />
          </>
        )}

        <button
          type="button"
          disabled={!validName || !pickedTarget || (isSwap && sameAsCurrent)}
          onClick={submit}
          style={{
            width: '100%',
            marginTop: requireName ? 0 : 18,
            padding: '14px 16px',
            borderRadius: 14,
            border: 'none',
            background: validName && pickedTarget && !(isSwap && sameAsCurrent)
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.08)',
            color: validName && pickedTarget && !(isSwap && sameAsCurrent)
              ? '#fff'
              : 'rgba(255,255,255,0.35)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'system-ui,sans-serif',
            cursor: validName && pickedTarget && !(isSwap && sameAsCurrent) ? 'pointer' : 'not-allowed',
          }}
        >
          {isSwap ? 'Go' : 'Enter the show'}
        </button>
      </div>
    </div>
  );
}
