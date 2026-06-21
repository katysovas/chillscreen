'use client';

import './GameControlBar.css';

const LOGO_SRC = '/images/logos/logo_transparent.png';

type BottomControlPanelProps = {
  hidden?: boolean;
  /** Opens the city / stage picker (desktop). */
  onOpenCityPicker?: () => void;
  isMobile?: boolean;
};

export function StageSwapIcon({ size = 18 }: { size?: number }) {
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
        d="M20 7H4m4-4L4 7l4 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17h16m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SignOutIcon({ size = 18 }: { size?: number }) {
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
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsIcon({ size = 18 }: { size?: number }) {
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
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M19.4 13.2a7.4 7.4 0 0 0 .1-2.4l2-1.5-2-3.5-2.4 1a7.6 7.6 0 0 0-2.1-1.2l-.4-2.6H9.4l-.4 2.6a7.6 7.6 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5a7.4 7.4 0 0 0 .1 2.4l-2 1.5 2 3.5 2.4-1a7.6 7.6 0 0 0 2.1 1.2l.4 2.6h5.2l.4-2.6a7.6 7.6 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LineupIcon({ size = 18 }: { size?: number }) {
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
        d="M5 6h14M5 12h14M5 18h10"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={18} cy={18} r={2.5} stroke="currentColor" strokeWidth={1.5} />
      <path d="M16.5 18h-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function StageSettingsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M4 7h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={9} cy={7} r={2} stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 12h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={15} cy={12} r={2} stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 17h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={11} cy={17} r={2} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

export function ShoppingCartIcon({ size = 18 }: { size?: number }) {
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
        d="M4 5h1.2l1.4 9.2a1.5 1.5 0 0 0 1.48 1.3h8.76a1.5 1.5 0 0 0 1.48-1.3L19.8 7H7.2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={10} cy={19.5} r={1.25} fill="currentColor" />
      <circle cx={16.5} cy={19.5} r={1.25} fill="currentColor" />
    </svg>
  );
}

/** Bottom-center logo — tap to switch stage. */
export function BottomControlPanel({
  hidden = false,
  onOpenCityPicker,
  isMobile = false,
}: BottomControlPanelProps) {
  const showLogo = Boolean(onOpenCityPicker) && !isMobile;

  if (hidden || !showLogo) {
    return null;
  }

  return (
    <div
      data-paraloid-ui
      className="hidden md:block bottom-5"
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 38,
        pointerEvents: 'auto',
      }}
    >
      <div className="game-control-bar">
        <button
          type="button"
          className="game-control-bar__logo-btn"
          onClick={onOpenCityPicker}
          aria-label="Switch stage"
          title="Switch stage"
        >
          <img src={LOGO_SRC} alt="Which Stage" draggable={false} />
        </button>
      </div>
    </div>
  );
}
