'use client';

import { useEffect, useMemo, useState } from 'react';
import { MobileStageCard } from './MobileStageCard';
import {
  buildStagePickerOptions,
  currentStagePickerTarget,
  stagePickerTargetId,
  stageTargetsEqual,
  type StagePickerTarget,
} from '@/lib/stagePickerOptions';
import { fetchFeaturedStages } from '@/lib/stages/client';
import type { VenueRoute } from '@/lib/venueRoutes';

type Props = {
  currentRoute: VenueRoute | null;
  currentCreatorSlug?: string | null;
  onSwap: (target: StagePickerTarget) => void;
  onClose: () => void;
};

/** Mobile-only — pick another stage without re-entering name. */
export function MobileStageSwapModal({
  currentRoute,
  currentCreatorSlug = null,
  onSwap,
  onClose,
}: Props) {
  const [featuredStages, setFeaturedStages] = useState<Awaited<ReturnType<typeof fetchFeaturedStages>>>([]);
  const currentTarget = useMemo(
    () => currentStagePickerTarget(currentRoute, currentCreatorSlug),
    [currentRoute, currentCreatorSlug],
  );
  const [pickedId, setPickedId] = useState<string | null>(
    currentTarget ? stagePickerTargetId(currentTarget) : null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchFeaturedStages()
      .then(stages => {
        if (!cancelled) setFeaturedStages(stages);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const options = useMemo(
    () => buildStagePickerOptions(featuredStages),
    [featuredStages],
  );

  const picked = options.find(o => o.id === pickedId) ?? null;
  const canSwap = picked != null
    && currentTarget != null
    && !stageTargetsEqual(picked.target, currentTarget);

  const submit = () => {
    if (!canSwap || !picked) return;
    onSwap(picked.target);
  };

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="mobile-stage-swap-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: 'max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#131415',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '24px 20px 20px',
          maxWidth: 400,
          width: '100%',
          fontFamily: "Georgia,'Times New Roman',serif",
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          position: 'relative',
        }}
      >
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

        <div
          id="mobile-stage-swap-title"
          style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 6 }}
        >
          Change stage
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {options.map(option => (
            <MobileStageCard
              key={option.id}
              title={option.title}
              tagline={option.tagline}
              selected={pickedId === option.id}
              onSelect={() => setPickedId(option.id)}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!canSwap}
          onClick={submit}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 14,
            border: 'none',
            background: canSwap
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.08)',
            color: canSwap ? '#fff' : 'rgba(255,255,255,0.35)',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'system-ui,sans-serif',
            cursor: canSwap ? 'pointer' : 'not-allowed',
          }}
        >
          Go to stage
        </button>
      </div>
    </div>
  );
}
