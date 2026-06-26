'use client';

import { useId, useSyncExternalStore } from 'react';
import { LineupIcon } from './BottomControlPanel';
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
import './GameControlBar.css';

type Props = {
  festie?: FestieOwner | null;
  stageLineupOpen?: boolean;
  showStageSettings?: boolean;
  onOpenStageSettings?: () => void;
  hidden?: boolean;
  isMobile?: boolean;
  onControlModeChange?: (mode: FestieControlMode) => void;
  /** Show autopilot toggle for guests (local-only, no festie row). */
  showAutopilot?: boolean;
  /** When false, autopilot only updates localStorage (anonymous guests). */
  persistAutopilot?: boolean;
  stagePanelOpen?: boolean;
  onOpenStagePanel?: () => void;
};

const CORNER_LEFT = 'max(12px, calc(env(safe-area-inset-left, 0px) + 8px))';

function StagePanelChatIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-3.5 3v-3H7.5A2.5 2.5 0 0 1 5 12.5v-6Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AutopilotSwitch({
  onControlModeChange,
  persistAutopilot = true,
}: {
  onControlModeChange?: (mode: FestieControlMode) => void;
  persistAutopilot?: boolean;
}) {
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
    onControlModeChange?.(next);
    if (!persistAutopilot) return;

    patchPlayerSessionFestie({ control_mode: next });
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
  stageLineupOpen: boolean;
  showStageSettings: boolean;
  isMobile: boolean;
  showAutopilot: boolean;
  persistAutopilot?: boolean;
  onOpenStageSettings?: () => void;
  onControlModeChange?: (mode: FestieControlMode) => void;
  stagePanelOpen?: boolean;
  onOpenStagePanel?: () => void;
};

function FestieControlBar({
  stageLineupOpen,
  showStageSettings,
  isMobile,
  showAutopilot,
  persistAutopilot = true,
  onOpenStageSettings,
  onControlModeChange,
  stagePanelOpen = false,
  onOpenStagePanel,
}: BarProps) {
  const iconSize = isMobile ? 18 : 16;
  const showLineup = showStageSettings && Boolean(onOpenStageSettings) && !isMobile;
  const showChat = isMobile && Boolean(onOpenStagePanel);
  const guestMatchBar = showAutopilot && !showLineup && !isMobile;

  return (
    <div
      className={[
        'game-control-bar',
        guestMatchBar ? 'festie-control-bar--guest-match' : 'festie-control-bar',
        stageLineupOpen ? 'game-control-bar--open festie-control-bar--open' : '',
        isMobile ? 'game-control-bar--mobile festie-control-bar--mobile' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showLineup && (
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
      )}

      {showLineup && showAutopilot && (
        <div className="game-control-bar__divider festie-control-divider" aria-hidden />
      )}

      {showAutopilot && (
        <AutopilotSwitch
          onControlModeChange={onControlModeChange}
          persistAutopilot={persistAutopilot}
        />
      )}

      {showChat && (
        <>
          {(showLineup || showAutopilot) && (
            <div className="game-control-bar__divider festie-control-divider" aria-hidden />
          )}
          <button
            type="button"
            className={['festie-icon-btn', stagePanelOpen ? 'festie-icon-btn--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={onOpenStagePanel}
            onPointerDown={e => e.preventDefault()}
            aria-label={stagePanelOpen ? 'Close stage panel' : 'Open stage panel'}
            aria-pressed={stagePanelOpen}
            title="Chat"
            style={{ touchAction: 'none' }}
          >
            <StagePanelChatIcon size={iconSize} />
          </button>
        </>
      )}
    </div>
  );
}

/** Bottom-left festie panel — lineup, Autopilot off/on in one row. */
export function FestieLifeCorner({
  festie: _festie,
  stageLineupOpen = false,
  showStageSettings = false,
  onOpenStageSettings,
  hidden = false,
  isMobile = false,
  onControlModeChange,
  showAutopilot: showAutopilotProp,
  persistAutopilot = true,
  stagePanelOpen = false,
  onOpenStagePanel,
}: Props) {
  if (hidden) return null;

  const showAutopilot = showAutopilotProp ?? Boolean(_festie);

  if (
    !showAutopilot
    && !(isMobile && onOpenStagePanel)
    && !(showStageSettings && onOpenStageSettings && !isMobile)
  ) {
    return null;
  }

  return (
    <div
      data-paraloid-ui
      className={isMobile ? 'festie-life-corner-mobile' : 'hidden md:block bottom-5'}
      style={{
        position: 'absolute',
        left: CORNER_LEFT,
        zIndex: isMobile ? 45 : 38,
        pointerEvents: 'auto',
      }}
    >
      <FestieControlBar
        stageLineupOpen={stageLineupOpen}
        showStageSettings={showStageSettings}
        isMobile={isMobile}
        showAutopilot={showAutopilot}
        persistAutopilot={persistAutopilot}
        onOpenStageSettings={onOpenStageSettings}
        onControlModeChange={onControlModeChange}
        stagePanelOpen={stagePanelOpen}
        onOpenStagePanel={onOpenStagePanel}
      />
    </div>
  );
}
