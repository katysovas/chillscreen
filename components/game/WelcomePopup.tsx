'use client';

import { useEffect, useState } from 'react';
import Character from './Character';
import { MobileStageCard } from './MobileStageCard';
import { createFestie, loginFestie } from '@/lib/festie/client';
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
  /** Two-step festie sign-in / create flow before entering. */
  requireAuth?: boolean;
  /** Signed-in users — stage pick only (name from DB). */
  pickStageOnly?: boolean;
  onAuthSuccess?: (name: string) => void;
  /** New festie account created (not sign-in). */
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
  fontSize: 13,
  color: 'rgba(255,255,255,0.65)',
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

/**
 * Full-screen welcome overlay.
 * - requireAuth: step 1 (name + password) → step 2 (stage pick)
 * - pickStageOnly: signed-in — stage pick only
 */
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
  const [authIntent, setAuthIntent] = useState<AuthIntent>('create');
  const [draft, setDraft] = useState('');
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
    if (initialName) setDraft(initialName);
  }, [initialName]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(isMobileLoungeDevice());
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const submit = async () => {
    if (requireAuth && step === 1) {
      goToStep2();
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
          await loginFestie(name, password);
        } else {
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
        }
        onAuthSuccess?.(name);
        onEnter(name, picked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setLoading(false);
      }
      return;
    }

  };

  const goToStep2 = () => {
    if (!canAdvanceStep1) return;
    setError(null);
    setStep(2);
  };

  const showStep1 = requireAuth && !pickStageOnly && step === 1;
  const showStep2 = pickStageOnly || step === 2;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      animation: 'wlc-fade-in 0.45s ease',
    }}>
      <div style={{
        background: '#131415',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: showStep1 ? '36px 36px 32px' : '44px 40px 36px',
        maxWidth: showStep1 ? 560 : 680,
        width: showStep1 ? 'min(94vw, 560px)' : 'min(94vw, 680px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
        fontFamily: "Georgia,'Times New Roman',serif",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_PATH}
          alt="WhichStage"
          style={{ height: 48, marginBottom: 16, objectFit: 'contain' }}
        />

        {showStep1 && (
          <>
            <div style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: 5,
              fontFamily: 'system-ui,sans-serif',
            }}>
              Real people. Real AIs. One festival
            </div>
            <span style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'system-ui,sans-serif',
              textAlign: 'center',
              marginBottom: 24,
            }}>
              Explore stages. Watch live shows. Pick a side.
            </span>

            <div style={{
              display: 'flex',
              gap: 6,
              marginBottom: 20,
              width: '100%',
              fontFamily: 'system-ui,sans-serif',
            }}>
              {([1, 2] as const).map(n => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: n === 1
                      ? 'linear-gradient(90deg, #ffb347, #e67e22)'
                      : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>

            <h2 style={{
              margin: '0 0 24px',
              fontSize: 20,
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
              fontFamily: 'system-ui,sans-serif',
            }}>
              {authIntent === 'create' ? 'Create your AI festie' : 'Welcome back'}
            </h2>

            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: mobile ? 'column' : 'row',
              gap: mobile ? 20 : 20,
              alignItems: mobile ? 'stretch' : 'center',
              marginBottom: 28,
            }}>
              <div style={{
                flex: mobile ? '0 0 auto' : '3 1 60%',
                width: mobile ? '100%' : undefined,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <label style={{ display: 'block', width: '100%' }}>
                  <span style={FIELD_LABEL}>Festie name</span>
                  <input
                    value={draft}
                    onChange={e => setDraft(sanitizeFestieNameInput(e.target.value))}
                    placeholder="e.g. GrooveGoblin"
                    autoFocus
                    autoComplete="username"
                    style={{
                      ...INPUT,
                      border: `1px solid ${!nameValid && draft.length > 0 ? 'rgba(230,126,34,0.55)' : 'rgba(255,255,255,0.18)'}`,
                    }}
                  />
                </label>

                <label style={{ display: 'block', width: '100%' }}>
                  <span style={FIELD_LABEL}>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value.slice(0, 64))}
                    placeholder="6–64 characters"
                    autoComplete={authIntent === 'create' ? 'new-password' : 'current-password'}
                    onKeyDown={e => { if (e.key === 'Enter' && canAdvanceStep1) goToStep2(); }}
                    style={INPUT}
                  />
                </label>
              </div>

              <div style={{
                flex: mobile ? '0 0 auto' : '2 1 40%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: mobile ? 140 : 160,
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'relative',
                  width: mobile ? 130 : 170,
                  height: mobile ? 140 : 160,
                  flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    animation: 'wlc-char-sway 3s ease-in-out infinite',
                  }}>
                    <Character
                      walking={false}
                      facing="left"
                      balloonColor={balloonColor}
                      scale={mobile ? 0.34 : 0.44}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canAdvanceStep1}
              style={{
                ...PRIMARY_BTN,
                cursor: canAdvanceStep1 ? 'pointer' : 'default',
                background: canAdvanceStep1
                  ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canAdvanceStep1 ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: canAdvanceStep1 ? '0 2px 10px rgba(230, 126, 34, 0.35)' : 'none',
              }}
            >
              Next →
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthIntent(authIntent === 'create' ? 'signin' : 'create');
                setError(null);
              }}
              style={{
                ...PRIMARY_BTN,
                marginTop: 14,
                background: 'transparent',
                color: '#8ab4f8',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {authIntent === 'create'
                ? 'Already have a festie? Sign in'
                : 'New here? Create a festie'}
            </button>
          </>
        )}

        {showStep2 && (
          <>
            {pickStageOnly && (
              <>
                <div style={{
                  fontSize: 16, color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center', lineHeight: 1.6, marginBottom: 5,
                  fontFamily: 'system-ui,sans-serif',
                }}>
                  Real people. Real AIs. One festival
                </div>
                <span style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                  marginBottom: 24,
                }}>
                  Explore stages. Watch live shows. Pick a side.
                </span>
              </>
            )}

            {(requireAuth || pickStageOnly) && (
              <>
                <div style={{
                  display: 'flex',
                  gap: 6,
                  marginBottom: 20,
                  width: '100%',
                  fontFamily: 'system-ui,sans-serif',
                }}>
                  {([1, 2] as const).map(n => (
                    <div
                      key={n}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 2,
                        background: n <= 2
                          ? 'linear-gradient(90deg, #ffb347, #e67e22)'
                          : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  ))}
                </div>
                <h2 style={{
                  margin: '0 0 6px',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#fff',
                  textAlign: 'center',
                  fontFamily: 'system-ui,sans-serif',
                }}>
                  Pick a stage
                </h2>
              </>
            )}

            {requireAuth && (
              <p style={{
                margin: '0 0 24px',
                fontSize: 14,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'system-ui,sans-serif',
              }}>
                Where should {draft.trim() || 'your festie'} hang out?
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
                width: '100%',
              }}>
                {error}
              </p>
            )}

            <div style={{
              display: 'flex',
              gap: 8,
              width: '100%',
            }}>
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
                  background: canSubmit && !loading
                    ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: canSubmit && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: canSubmit && !loading ? '0 2px 10px rgba(230, 126, 34, 0.35)' : 'none',
                }}
              >
                {loading
                  ? (authIntent === 'signin' ? 'Signing in…' : 'Creating…')
                  : 'Let\u2019s go \u2192'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
