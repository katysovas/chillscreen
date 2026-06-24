'use client';

import { useMemo, useState } from 'react';
import {
  currentStagePickerTarget,
  stagePickerTargetId,
  stageTargetsEqual,
  type StagePickerTarget,
} from '@/lib/stagePickerOptions';
import { SwitchStagesChart } from '@/components/stages/SwitchStagesChart';
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
  const currentTarget = useMemo(
    () => currentStagePickerTarget(currentRoute, currentCreatorSlug),
    [currentRoute, currentCreatorSlug],
  );
  const currentId = currentTarget ? stagePickerTargetId(currentTarget) : null;
  const [pickedId, setPickedId] = useState<string | null>(currentId);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="mobile-stage-swap-chart-title"
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
          maxWidth: 720,
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

        <SwitchStagesChart
          titleId="mobile-stage-swap-chart-title"
          selectedId={pickedId}
          currentId={currentId}
          onSelect={target => setPickedId(stagePickerTargetId(target))}
          onJoin={target => {
            if (currentTarget && stageTargetsEqual(target, currentTarget)) return;
            onSwap(target);
          }}
        />
      </div>
    </div>
  );
}
