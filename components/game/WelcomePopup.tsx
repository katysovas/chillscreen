'use client';

import { useEffect, useState } from 'react';
import Character from './Character';
import { MobileStageCard } from './MobileStageCard';
import { createFestie, loginFestie } from '@/lib/festie/client';
import { venueRouteForStageSlug } from '@/lib/festie/stage';
import { getLocalFestieName, hasLocalFestieAccount } from '@/lib/festie/localAccount';
import {
  isValidFestieName,
  isValidFestiePassword,
  sanitizeFestieNameInput,
} from '@/lib/festie/validation';
import { isMobileLoungeDevice, MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import { LOGO_PATH } from '@/lib/site';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';

type Props = {
  balloonColor: string;
  initialRoute?: VenueRoute;
  onEnter: (name: string, route: VenueRoute) => void;
  requireAuth?: boolean;
  pickStageOnly?: boolean;
  onAuthSuccess?: (name: string) => void;
  onFestieCreated?: () => void;
  initialName?: string;
};

type AuthIntent = 'create' | 'signin';

const INPUT: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 15,
  color: '#fff',
  outline: 'none',
  fontFamily: 'system-ui,sans-serif',
};

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'rgba(255,255,255,0.55)',
  fontFamily: 'system-ui,sans-serif',
  fontWeight: 500,
  marginBottom: 6,
};

const PRIMARY_BTN: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  padding: '12px 20px',
  fontSize: 15,
  fontWeight: 700,
  border: 'none',
  fontFamily: 'system-ui,sans-serif',
  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
};

const HERO_TITLE: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.88)',
  textAlign: 'center',
  fontFamily: 'system-ui,sans-serif',
  lineHeight: 1.4,
};

const HERO_SUB: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: 'system-ui,sans-serif',
  textAlign: 'center',
  lineHeight: 1.45,
};

function ModalHero() {
  return (
    <div style={{ marginBottom: 20 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_PATH}
        alt="WhichStage"
        style={{ height: 44, margin: '0 auto 16px', display: 'block', objectFit: 'contain' }}
      />
      <h1 style={HERO_TITLE}>Join the AI Festival</h1>
      <p style={HERO_SUB}>Explore stages. Watch live sets. Blend in.</p>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        height: 4,
        background: 'rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #ffb347, #e67e22)',
          transition: 'width 0.35s ease',
        }}
      />
    </div>
  );
}

function AuthTabs({
  authIntent,
  onChange,
}: {
  authIntent: AuthIntent;
  onChange: (mode: AuthIntent) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Account mode"
      style={{
        display: 'flex',
        gap: 8,
        width: '100%',
        marginBottom: 16,
        fontFamily: 'system-ui,sans-serif',
      }}
    >
      {([
        { mode: 'create' as const, label: 'Create Your Festival Buddy' },
        { mode: 'signin' as const, label: 'Sign In' },
      ]).map(({ mode, label }) => {
        const active = authIntent === mode;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            style={{
              flex: 1,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 600,
              border: active
                ? '1px solid rgba(230,126,34,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              background: active ? 'rgba(230,126,34,0.16)' : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function WelcomePopup({
  balloonColor,
  initialRoute,
  onEnter,
  requireAuth = true,
  pickStageOnly = false,
  onAuthSuccess,
  onFestieCreated,
  initialName,
}: Props) {
  const [step, setStep] = useState<1 | 2>(pickStageOnly ? 2 : requireAuth ? 1 : 2);
  const [authIntent, setAuthIntent] = useState<AuthIntent>(() =>
    hasLocalFestieAccount() ? 'signin' : 'create',
  );
  const [draft, setDraft] = useState(() => {
    if (initialName?.trim()) return initialName.trim();
    return getLocalFestieName() ?? '';
  });
  const [password, setPassword] = useState('');
  const [picked, setPicked] = useState<VenueRoute | null>(initialRoute ?? null);
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = isValidFestieName(draft);
  const passwordValid = isValidFestiePassword(password);
  const canAdvanceStep1 = nameValid && passwordValid;
  const canSubmit = pickStageOnly
    ? Boolean(draft.trim()) && picked !== null
    : requireAuth
      ? step === 1
        ? canAdvanceStep1
        : nameValid && passwordValid && picked !== null
      : false;

  useEffect(() => {
    if (initialName?.trim()) setDraft(initialName.trim());
  }, [initialName]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(isMobileLoungeDevice());
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const advanceFromStep1 = async () => {
    if (!canAdvanceStep1 || loading) return;
    setError(null);

    if (authIntent === 'signin') {
      setLoading(true);
      try {
        const festie = await loginFestie(draft.trim(), password);
        setDraft(festie.name);
        onAuthSuccess?.(festie.name);
        const savedRoute = venueRouteForStageSlug(festie.stage_slug);
        if (savedRoute) {
          onEnter(festie.name, savedRoute);
          return;
        }
        setPicked(null);
        setStep(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(2);
  };

  const submit = async () => {
    if (requireAuth && step === 1) {
      await advanceFromStep1();
      return;
    }

    const name = draft.trim();
    if (!canSubmit || !picked) return;

    if (pickStageOnly) {
      onEnter(name, picked);
      return;
    }

    if (requireAuth) {
      setLoading(true);
      setError(null);
      try {
        if (authIntent === 'signin') {
          onEnter(name, picked);
          return;
        }
        await createFestie({
          name,
          password,
          preset: 'ember',
          attributes: { energy: 5, friendliness: 5, chattiness: 5 },
          topics: [],
          personality_notes: null,
          stage_slug: venueSlugForRoute(picked),
        });
        onFestieCreated?.();
        onAuthSuccess?.(name);
        onEnter(name, picked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setLoading(false);
      }
    }
  };

  const showStep1 = requireAuth && step === 1;
  const showStep2 = step === 2 || (!requireAuth && pickStageOnly);
  const isCreate = authIntent === 'create';
  const progressPct = pickStageOnly ? 100 : step === 1 ? 50 : 100;
  const modalWidth = showStep2 && !showStep1 ? 680 : 520;

  const setAuthMode = (mode: AuthIntent) => {
    setAuthIntent(mode);
    setError(null);
  };

  const primaryBtnBg = (enabled: boolean) => {
    if (!enabled) return 'rgba(255,255,255,0.1)';
    return isCreate
      ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
      : 'linear-gradient(180deg, #7eb8ff 0%, #4a8fd4 100%)';
  };

  const primaryBtnShadow = (enabled: boolean) => {
    if (!enabled) return 'none';
    return isCreate
      ? '0 2px 10px rgba(230, 126, 34, 0.35)'
      : '0 2px 10px rgba(74, 143, 212, 0.35)';
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      animation: 'wlc-fade-in 0.45s ease',
      padding: 16,
    }}>
      <div style={{
        background: '#131415',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        maxWidth: modalWidth,
        width: `min(94vw, ${modalWidth}px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        fontFamily: "Georgia,'Times New Roman',serif",
      }}>
        {(requireAuth || pickStageOnly) && <ProgressBar pct={progressPct} />}

        <div style={{ padding: mobile ? '28px 22px 24px' : '32px 36px 28px' }}>
          <ModalHero />

          {showStep1 && (
            <>
              <AuthTabs authIntent={authIntent} onChange={setAuthMode} />

              <div style={{
                position: 'relative',
                width: '100%',
                height: mobile ? 120 : 140,
                marginBottom: 20,
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: -20,
                  animation: 'wlc-char-sway 3s ease-in-out infinite',
                }}>
                  <Character
                    walking={false}
                    facing="left"
                    balloonColor={balloonColor}
                    scale={mobile ? 0.38 : 0.44}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: mobile ? 'column' : 'row',
                gap: 12,
                width: '100%',
                marginBottom: 8,
              }}>
                <label style={{ flex: 1, minWidth: 0 }}>
                  <span style={FIELD_LABEL}>Festie name</span>
                  <input
                    value={draft}
                    onChange={e => setDraft(sanitizeFestieNameInput(e.target.value))}
                    placeholder="GrooveGoblin"
                    autoFocus
                    autoComplete="username"
                    style={{
                      ...INPUT,
                      border: `1px solid ${!nameValid && draft.length > 0 ? 'rgba(230,126,34,0.55)' : 'rgba(255,255,255,0.18)'}`,
                    }}
                  />
                </label>

                <label style={{ flex: 1, minWidth: 0 }}>
                  <span style={FIELD_LABEL}>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value.slice(0, 64))}
                    placeholder="6–64 characters"
                    autoComplete={isCreate ? 'new-password' : 'current-password'}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && canAdvanceStep1 && !loading) void advanceFromStep1();
                    }}
                    style={INPUT}
                  />
                </label>
              </div>

              

              {error && (
                <p style={{
                  color: '#ff9d9d',
                  fontSize: 13,
                  margin: '0 0 12px',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}>
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void advanceFromStep1()}
                disabled={!canAdvanceStep1 || loading}
                style={{
                  ...PRIMARY_BTN,
                  cursor: canAdvanceStep1 && !loading ? 'pointer' : 'default',
                  background: primaryBtnBg(canAdvanceStep1 && !loading),
                  color: canAdvanceStep1 && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: primaryBtnShadow(canAdvanceStep1 && !loading),
                }}
              >
                {loading
                  ? 'Signing in…'
                  : isCreate
                    ? 'Create festie →'
                    : 'Sign in →'}
              </button>
            </>
          )}

          {showStep2 && (
            <>
              <h2 style={{
                margin: '0 0 8px',
                fontSize: 20,
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
                fontFamily: 'system-ui,sans-serif',
              }}>
                Pick a stage
              </h2>

              {requireAuth && !pickStageOnly && (
                <p style={{
                  margin: '0 0 20px',
                  fontSize: 13,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'system-ui,sans-serif',
                }}>
                  {isCreate
                    ? `Where should ${draft.trim() || 'your festie'} hang out?`
                    : `Pick a stage for ${draft.trim() || 'your festie'}`}
                </p>
              )}

              {pickStageOnly && (
                <p style={{
                  margin: '0 0 20px',
                  fontSize: 13,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'system-ui,sans-serif',
                }}>
                  Where are you heading?
                </p>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: mobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                width: '100%',
                marginBottom: 18,
              }}>
                {MOBILE_LOUNGE_STAGES.map(stage => (
                  <MobileStageCard
                    key={stage.route}
                    stage={stage}
                    selected={picked === stage.route}
                    onSelect={() => setPicked(stage.route)}
                  />
                ))}
              </div>

              {error && (
                <p style={{
                  color: '#ff9d9d',
                  fontSize: 13,
                  margin: '0 0 12px',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                {requireAuth && !pickStageOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setLoading(false);
                    }}
                    style={{
                      ...PRIMARY_BTN,
                      width: 'auto',
                      flex: '0 0 auto',
                      padding: '12px 18px',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSubmit || loading}
                  style={{
                    ...PRIMARY_BTN,
                    flex: 1,
                    cursor: canSubmit && !loading ? 'pointer' : 'default',
                    background: primaryBtnBg(canSubmit && !loading),
                    color: canSubmit && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
                    boxShadow: primaryBtnShadow(canSubmit && !loading),
                  }}
                >
                {loading
                  ? (isCreate ? 'Creating festie…' : 'Entering…')
                  : (isCreate ? 'Create & enter →' : 'Enter festival →')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
