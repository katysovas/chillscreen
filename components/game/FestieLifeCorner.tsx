'use client';

import { useId, useSyncExternalStore } from 'react';
import { LineupIcon, SettingsIcon } from './BottomControlPanel';
import {
  getFestieControlMode,
  setFestieControlMode,
  subscribeFestieControlMode,
  type FestieControlMode,
} from '@/lib/festie/controlMode';
import { updateFestie } from '@/lib/festie/client';
import { patchPlayerSessionFestie } from '@/lib/player/session';
import type { FestieOwner } from '@/lib/festie/types';
import './FestieLifeCorner.css';

type Props = {
  festie: FestieOwner;
  settingsOpen?: boolean;
  stageLineupOpen?: boolean;
  showStageSettings?: boolean;
  onOpenStageSettings?: () => void;
  hidden?: boolean;
  isMobile?: boolean;
  onOpenSettings: () => void;
  onControlModeChange?: (mode: FestieControlMode) => void;
};

const CORNER_LEFT = 'max(12px, calc(env(safe-area-inset-left, 0px) + 8px))';

function AutopilotSwitch({ onControlModeChange }: { onControlModeChange?: (mode: FestieControlMode) => void }) {
  const toggleId = useId();
  const mode = useSyncExternalStore(
    subscribeFestieControlMode,
    getFestieControlMode,
    () => 'human' as FestieControlMode,
  );
  const autopilotOn = mode === 'ai';

  const handleToggle = (next: FestieControlMode) => {
    const prev = getFestieControlMode();
    setFestieControlMode(next);
    patchPlayerSessionFestie({ control_mode: next });
    onControlModeChange?.(next);
    void updateFestie({ control_mode: next })
      .then(festie => {
        onControlModeChange?.(festie.control_mode);
      })
      .catch(err => {
        console.error('[autopilot] failed to persist control_mode', err);
        setFestieControlMode(prev);
        patchPlayerSessionFestie({ control_mode: prev });
        onControlModeChange?.(prev);
      });
  };

  return (
    <div
      className="festie-autopilot-row"
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      <span className="festie-autopilot-label">Autopilot</span>
      <div className="festie-neon-toggle">
        <input
          type="checkbox"
          id={toggleId}
          className="toggle--checkbox"
          checked={autopilotOn}
          onChange={e => handleToggle(e.target.checked ? 'ai' : 'human')}
          aria-label="Autopilot"
        />
        <label
          className="toggle--btn"
          htmlFor={toggleId}
          data-label-on="on"
          data-label-off="off"
        />
      </div>
    </div>
  );
}

type BarProps = {
  settingsOpen: boolean;
  stageLineupOpen: boolean;
  showStageSettings: boolean;
  isMobile: boolean;
  onOpenSettings: () => void;
  onOpenStageSettings?: () => void;
  onControlModeChange?: (mode: FestieControlMode) => void;
};

function FestieControlBar({
  settingsOpen,
  stageLineupOpen,
  showStageSettings,
  isMobile,
  onOpenSettings,
  onOpenStageSettings,
  onControlModeChange,
}: BarProps) {
  const iconSize = isMobile ? 18 : 16;
  const showLineup = showStageSettings && Boolean(onOpenStageSettings);

  return (
    <div
      className={[
        'festie-control-bar',
        settingsOpen ? 'festie-control-bar--open' : '',
        isMobile ? 'festie-control-bar--mobile' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={['festie-icon-btn', settingsOpen ? 'festie-icon-btn--active' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={onOpenSettings}
        onPointerDown={isMobile ? e => e.preventDefault() : undefined}
        aria-label="Settings"
        aria-pressed={settingsOpen}
        title="Settings"
        style={isMobile ? { touchAction: 'none' } : undefined}
      >
        <SettingsIcon size={iconSize} />
      </button>

      {showLineup && (
        <>
          <div className="festie-control-divider" aria-hidden />
          <button
            type="button"
            className={['festie-icon-btn', stageLineupOpen ? 'festie-icon-btn--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={onOpenStageSettings}
            onPointerDown={isMobile ? e => e.preventDefault() : undefined}
            aria-label="Lineup settings"
            aria-pressed={stageLineupOpen}
            title="Lineup"
            style={isMobile ? { touchAction: 'none' } : undefined}
          >
            <LineupIcon size={iconSize} />
          </button>
        </>
      )}

      <div className="festie-control-divider" aria-hidden />

      <AutopilotSwitch onControlModeChange={onControlModeChange} />
    </div>
  );
}

/** Bottom-left festie panel — settings, lineup, Autopilot off/on in one row. */
export function FestieLifeCorner({
  festie: _festie,
  settingsOpen = false,
  stageLineupOpen = false,
  showStageSettings = false,
  onOpenStageSettings,
  hidden = false,
  isMobile = false,
  onOpenSettings,
  onControlModeChange,
}: Props) {
  if (hidden) return null;

  return (
    <div
      data-paraloid-ui
      className={isMobile ? 'festie-life-corner-mobile' : 'bottom-5'}
      style={{
        position: 'absolute',
        left: CORNER_LEFT,
        zIndex: isMobile ? 45 : 38,
        pointerEvents: 'auto',
      }}
    >
      <FestieControlBar
        settingsOpen={settingsOpen}
        stageLineupOpen={stageLineupOpen}
        showStageSettings={showStageSettings}
        isMobile={isMobile}
        onOpenSettings={onOpenSettings}
        onOpenStageSettings={onOpenStageSettings}
        onControlModeChange={onControlModeChange}
      />
    </div>
  );
}
