'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Character from '@/components/game/Character';
import { festiePresetById } from '@/lib/festie/presets';
import { loginFestie, fetchAuthMe } from '@/lib/festie/client';
import { getLocalFestieName, hasLocalFestieAccount } from '@/lib/festie/localAccount';
import type { FestieOwner } from '@/lib/festie/types';
import {
  isValidFestieName,
  isValidFestiePassword,
  sanitizeFestieNameInput,
} from '@/lib/festie/validation';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  checkStageSlug,
  createUserStage,
  fetchMyStage,
  parseStageStreamUrl,
} from '@/lib/stages/client';
import { STAGE_SCENE_PRESETS, STAGE_SKY_OPTIONS } from '@/lib/stages/presets';
import { stagePathForSlug } from '@/lib/stages/runtime';
import type { StagePresetId, StageStream } from '@/lib/stages/types';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';
import { LOGO_PATH, SITE_TAGLINE } from '@/lib/site';

const TOTAL_STEPS = 3;

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
  color: 'rgba(255,255,255,0.68)',
  fontFamily: 'system-ui,sans-serif',
  fontWeight: 500,
  marginBottom: 6,
};

const LABEL = FIELD_LABEL;

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
      <h1 style={HERO_TITLE}>{SITE_TAGLINE}</h1>
      <p style={HERO_SUB}>Explore stages. Watch live sets. Blend in.</p>
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_PATH} alt="WhichStage" style={{ height: 36, margin: '0 auto 12px' }} />
      <p style={{
        margin: 0,
        fontSize: 12,
        color: 'rgba(255,255,255,0.58)',
        fontFamily: 'system-ui,sans-serif',
      }}
      >
        Step {step} of {TOTAL_STEPS}
      </p>
    </div>
  );
}

const STEP_TITLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 22,
  fontWeight: 700,
  textAlign: 'center',
  color: 'rgba(255,255,255,0.95)',
  fontFamily: 'system-ui,sans-serif',
};

const STEP_SUB: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: 13,
  color: 'rgba(255,255,255,0.68)',
  textAlign: 'center',
  fontFamily: 'system-ui,sans-serif',
};

type Draft = {
  slug: string;
  festieName: string;
  festiePassword: string;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
};

const DEFAULT_DRAFT: Draft = {
  slug: '',
  festieName: '',
  festiePassword: '',
  preset: 'thefarm',
  streams: [],
};

const FESTIE_BALLOON_COLOR = festiePresetById('ember').balloonColor;

type AuthIntent = 'create' | 'signin';

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

function ProgressBar({ step }: { step: number }) {
  const pct = (step / TOTAL_STEPS) * 100;
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} aria-hidden>
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

export function CreateStageWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [authIntent, setAuthIntent] = useState<AuthIntent>('create');
  const [signedInFestie, setSignedInFestie] = useState<FestieOwner | null>(null);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamInput, setStreamInput] = useState('');
  const [streamParsing, setStreamParsing] = useState(false);
  const [mobile, setMobile] = useState(false);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasLocalFestieAccount()) setAuthIntent('signin');
    const savedName = getLocalFestieName();
    if (savedName) {
      setDraft(d => ({ ...d, festieName: savedName }));
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { authenticated, festie } = await fetchAuthMe();
        if (cancelled || !authenticated || !festie) return;
        const existing = await fetchMyStage();
        if (cancelled) return;
        if (existing) {
          setError('You already have a stage (one per account in v1).');
          return;
        }
        setSignedInFestie(festie);
        setDraft(d => ({ ...d, festieName: festie.name }));
        setStep(2);
      } catch {
        /* ignore — user can sign in manually */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isCreate = authIntent === 'create';
  const nameValid = isValidFestieName(draft.festieName);
  const passwordValid = isValidFestiePassword(draft.festiePassword);
  const canSubmitAuth = nameValid && passwordValid;

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

  const advancePastAuth = async () => {
    const existing = await fetchMyStage();
    if (existing) {
      setError('You already have a stage (one per account in v1).');
      return;
    }
    setError(null);
    setStep(2);
  };

  const submitStep1 = async () => {
    if (signedInFestie) {
      await advancePastAuth();
      return;
    }
    if (!canSubmitAuth || loading) return;
    setError(null);
    setLoading(true);
    try {
      if (authIntent === 'signin') {
        const { festie } = await loginFestie(draft.festieName.trim(), draft.festiePassword);
        setSignedInFestie(festie);
        setDraft(d => ({ ...d, festieName: festie.name }));
        await advancePastAuth();
        return;
      }
      await advancePastAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const checkSlugDebounced = useCallback((slug: string) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!slug.trim()) {
      setSlugStatus('idle');
      setSlugMessage(null);
      return;
    }
    setSlugStatus('checking');
    slugTimer.current = setTimeout(async () => {
      try {
        const result = await checkStageSlug(slug);
        if (result.available) {
          setSlugStatus('ok');
          setSlugMessage('Available!');
        } else {
          setSlugStatus('bad');
          setSlugMessage(result.reason ?? 'Unavailable');
        }
      } catch {
        setSlugStatus('bad');
        setSlugMessage('Could not check availability');
      }
    }, 400);
  }, []);

  useEffect(() => () => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
  }, []);

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return signedInFestie != null || canSubmitAuth;
      case 2:
        return slugStatus === 'ok' && draft.slug.trim().length > 0 && Boolean(draft.preset);
      case 3:
        return draft.streams.length > 0;
      default:
        return false;
    }
  };

  const addStream = async () => {
    const url = streamInput.trim();
    if (!url || streamParsing) return;
    if (draft.streams.length >= STAGE_CONFIG.MAX_STREAMS) {
      setError(`Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.`);
      return;
    }
    setError(null);
    setStreamParsing(true);
    try {
      const result = await parseStageStreamUrl(url);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (draft.streams.some(s => s.videoId === result.stream.videoId)) {
        setError('That video is already in your lineup.');
        return;
      }
      setDraft(d => ({ ...d, streams: [...d.streams, result.stream] }));
      setStreamInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse video');
    } finally {
      setStreamParsing(false);
    }
  };

  const removeStream = (videoId: string) => {
    setDraft(d => ({ ...d, streams: d.streams.filter(s => s.videoId !== videoId) }));
  };

  const handleCreate = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const payload: Parameters<typeof createUserStage>[0] = {
        slug: draft.slug.trim().toLowerCase(),
        preset: draft.preset,
        sky: draft.sky,
        streams: draft.streams,
      };
      if (!signedInFestie) {
        payload.festie = {
          name: draft.festieName.trim(),
          password: draft.festiePassword,
          preset: 'ember',
          attributes: { energy: 5, friendliness: 5, chattiness: 5 },
          topics: [],
          personality_notes: null,
        };
      }
      await createUserStage(payload);
      router.push(stagePathForSlug(draft.slug.trim().toLowerCase()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      animation: 'wlc-fade-in 0.45s ease',
      padding: 16,
      fontFamily: "Georgia,'Times New Roman',serif",
    }}>
      <div style={{
        background: '#131415',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        maxWidth: step === 1 ? 520 : 560,
        width: `min(94vw, ${step === 1 ? 520 : 560}px)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
      }}>
        <ProgressBar step={step} />

        <div style={{
          padding: step === 1 ? (mobile ? '28px 22px 24px' : '32px 36px 28px') : '28px 28px 24px',
          color: 'rgba(255,255,255,0.9)',
        }}>
          {step === 1 ? <ModalHero /> : <StepHeader step={step} />}

          {step === 1 && (
            <>
              {!signedInFestie && (
                <AuthTabs
                  authIntent={authIntent}
                  onChange={mode => {
                    setAuthIntent(mode);
                    setError(null);
                  }}
                />
              )}

              <div style={{
                position: 'relative',
                width: '100%',
                height: mobile ? 120 : 140,
                marginBottom: 20,
                pointerEvents: 'none',
              }}
              >
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: -20,
                  animation: 'wlc-char-sway 3s ease-in-out infinite',
                }}
                >
                  <Character
                    walking={false}
                    facing="left"
                    balloonColor={FESTIE_BALLOON_COLOR}
                    scale={mobile ? 0.38 : 0.44}
                  />
                </div>
              </div>

              {signedInFestie ? (
                <p style={{
                  margin: '0 0 16px',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                  fontFamily: 'system-ui,sans-serif',
                }}
                >
                  Signed in as <strong>{signedInFestie.name}</strong>
                </p>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: mobile ? 'column' : 'row',
                  gap: 12,
                  width: '100%',
                  marginBottom: 8,
                }}
                >
                  <label style={{ flex: 1, minWidth: 0 }}>
                    <span style={FIELD_LABEL}>Festie name</span>
                    <input
                      value={draft.festieName}
                      onChange={e => setDraft(d => ({
                        ...d,
                        festieName: sanitizeFestieNameInput(e.target.value),
                      }))}
                      placeholder="GrooveGoblin"
                      autoFocus
                      autoComplete="username"
                      style={{
                        ...INPUT,
                        border: `1px solid ${!nameValid && draft.festieName.length > 0
                          ? 'rgba(230,126,34,0.55)'
                          : 'rgba(255,255,255,0.18)'}`,
                      }}
                    />
                  </label>

                  <label style={{ flex: 1, minWidth: 0 }}>
                    <span style={FIELD_LABEL}>Password</span>
                    <input
                      type="password"
                      value={draft.festiePassword}
                      onChange={e => setDraft(d => ({
                        ...d,
                        festiePassword: e.target.value.slice(0, 64),
                      }))}
                      placeholder="6–64 characters"
                      autoComplete={isCreate ? 'new-password' : 'current-password'}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && canSubmitAuth && !loading) void submitStep1();
                      }}
                      style={INPUT}
                    />
                  </label>
                </div>
              )}

              {step === 1 && error && (
                <p style={{
                  color: '#ff9d9d',
                  fontSize: 13,
                  margin: '12px 0 0',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void submitStep1()}
                disabled={!canAdvance() || loading}
                style={{
                  ...PRIMARY_BTN,
                  marginTop: 16,
                  cursor: canAdvance() && !loading ? 'pointer' : 'default',
                  background: primaryBtnBg(canAdvance() && !loading),
                  color: canAdvance() && !loading ? '#fff' : 'rgba(255,255,255,0.3)',
                  boxShadow: primaryBtnShadow(canAdvance() && !loading),
                }}
              >
                {loading
                  ? (isCreate ? 'Continuing…' : 'Signing in…')
                  : signedInFestie
                    ? 'Continue →'
                    : isCreate
                      ? 'Continue →'
                      : 'Sign in →'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={STEP_TITLE}>
                Name &amp; style your stage
              </h1>
              <p style={STEP_SUB}>
                Pick your URL and a scene.
              </p>
              <label style={LABEL}>Stage slug</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
                <span style={{
                  padding: '11px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRight: 'none',
                  borderRadius: '12px 0 0 12px',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.62)',
                  fontFamily: 'system-ui,sans-serif',
                }}
                >
                  whichstage.com/watch/
                </span>
                <input
                  style={{ ...INPUT, borderRadius: '0 12px 12px 0', flex: 1 }}
                  value={draft.slug}
                  onChange={e => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, STAGE_CONFIG.SLUG_MAX_LENGTH);
                    setDraft(d => ({ ...d, slug: v }));
                    checkSlugDebounced(v);
                  }}
                  placeholder="my-stage"
                  autoFocus
                  spellCheck={false}
                />
              </div>
              {slugMessage && (
                <p style={{
                  margin: '0 0 20px',
                  fontSize: 12,
                  fontFamily: 'system-ui,sans-serif',
                  color: slugStatus === 'ok' ? '#6fcf97' : '#ff6b6b',
                }}
                >
                  {slugStatus === 'checking' ? 'Checking…' : slugMessage}
                </p>
              )}

              <label style={{ ...LABEL, marginTop: slugMessage ? 0 : 12 }}>Scene</label>
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {STAGE_SCENE_PRESETS.map(p => {
                  const active = draft.preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDraft(d => ({ ...d, preset: p.id }))}
                      style={{
                        textAlign: 'left',
                        borderRadius: 12,
                        padding: '14px 16px',
                        border: active
                          ? '1px solid rgba(230,126,34,0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(230,126,34,0.12)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontFamily: 'system-ui,sans-serif',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>
                        {p.tagline}
                      </div>
                    </button>
                  );
                })}
              </div>
              <label style={LABEL}>Sky (optional)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, sky: undefined }))}
                  style={{
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    border: !draft.sky
                      ? '1px solid rgba(230,126,34,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: !draft.sky ? 'rgba(230,126,34,0.16)' : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'system-ui,sans-serif',
                  }}
                >
                  Auto
                </button>
                {STAGE_SKY_OPTIONS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDraft(d => ({ ...d, sky: s.id }))}
                    style={{
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 12,
                      border: draft.sky === s.id
                        ? '1px solid rgba(230,126,34,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      background: draft.sky === s.id
                        ? 'rgba(230,126,34,0.16)'
                        : 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'system-ui,sans-serif',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={STEP_TITLE}>
                Add streams
              </h1>
              <p style={{ ...STEP_SUB, marginBottom: 16 }}>
                Paste YouTube links — one plays at a time, you swap live.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  style={{ ...INPUT, flex: 1 }}
                  value={streamInput}
                  onChange={e => setStreamInput(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  onKeyDown={e => { if (e.key === 'Enter') void addStream(); }}
                />
                <button
                  type="button"
                  onClick={() => void addStream()}
                  disabled={streamParsing || !streamInput.trim()}
                  style={{
                    borderRadius: 12,
                    padding: '0 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    background: 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)',
                    color: '#fff',
                    cursor: streamParsing ? 'wait' : 'pointer',
                    opacity: streamParsing || !streamInput.trim() ? 0.5 : 1,
                    fontFamily: 'system-ui,sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {streamParsing ? '…' : 'Add'}
                </button>
              </div>
              {draft.streams.length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {draft.streams.map((s, i) => (
                    <li
                      key={s.videoId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)',
                        fontFamily: 'system-ui,sans-serif',
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.thumbnail} alt="" width={48} height={36} style={{ borderRadius: 4, objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'rgba(255,255,255,0.92)',
                        }}>
                          {i === 0 ? '▶ ' : ''}{s.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStream(s.videoId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          fontSize: 18,
                          lineHeight: 1,
                        }}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {draft.streams.length === 0 && (
                <p style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}
                >
                  Add at least one YouTube link to create your stage.
                </p>
              )}
            </>
          )}

          {error && step !== 1 && (
            <p style={{
              margin: '12px 0 0',
              fontSize: 13,
              color: '#ff6b6b',
              fontFamily: 'system-ui,sans-serif',
              textAlign: 'center',
            }}
            >
              {error}
            </p>
          )}

          {step > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => { setError(null); setStep(s => s - 1); }}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 15,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  fontFamily: 'system-ui,sans-serif',
                }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canAdvance() || loading}
                onClick={() => {
                  setError(null);
                  if (step === 3) {
                    void handleCreate();
                  } else {
                    setStep(s => s + 1);
                  }
                }}
                style={{
                  flex: 2,
                  borderRadius: 12,
                  padding: '12px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  background: canAdvance() && !loading
                    ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: canAdvance() ? '#fff' : 'rgba(255,255,255,0.35)',
                  cursor: canAdvance() && !loading ? 'pointer' : 'default',
                  fontFamily: 'system-ui,sans-serif',
                }}
              >
                {loading ? 'Creating…' : step === 3 ? 'Create stage' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
