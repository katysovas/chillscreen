'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Character from '@/components/game/Character';
import { festiePresetById } from '@/lib/festie/presets';
import { loginFestie, fetchAuthMe } from '@/lib/festie/client';
import { getLocalFestieName, hasLocalFestieAccount } from '@/lib/festie/localAccount';
import type { FestieOwner } from '@/lib/festie/types';
import {
  isValidFestieName,
  isValidFestiePassword,
  isValidNotifyEmail,
  sanitizeFestieNameInput,
} from '@/lib/festie/validation';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  checkStageSlug,
  createUserStage,
  fetchMyStage,
  parseStageStreams,
  takedownUserStage,
  uploadStageBackdrop,
} from '@/lib/stages/client';
import {
  stageBackdropUploadHint,
  validateBackdropFileForUpload,
} from '@/lib/stages/backdropValidation';
import type { StageStreamPasteMode } from '@/lib/stages/parseStream';
import { stagePathForSlug } from '@/lib/stages/runtime';
import {
  limitStageDisplayNameInput,
  stageDisplayNameHint,
  validateStageDisplayName,
} from '@/lib/stages/stageDisplayName';
import {
  stageNameToSlug,
  validateStageSlugFormat,
} from '@/lib/stages/slugValidation';
import type { StagePresetId, StageStream } from '@/lib/stages/types';
import { DEFAULT_STAGE_WALLPAPER_URL } from '@/lib/stages/wallpapers';
import { StageSceneGallery, type StageGallerySelection } from '@/components/create/StageSceneGallery';
import { LOGO_PATH, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import { ForgotPasswordPanel } from '@/components/auth/ForgotPasswordPanel';
import { getPlayerSession, hydratePlayerSession } from '@/lib/player/session';

const TOTAL_STEPS = 4;
const STAGE_EXISTS_MSG = 'You already have a stage.';
const MODAL_WIDTH_AUTH = 520;
const MODAL_WIDTH_SETUP = 720;

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

function StepHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_PATH} alt="WhichStage" style={{ height: 36, margin: '0 auto 12px' }} />
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
  stageName: string;
  slug: string;
  festieName: string;
  festiePassword: string;
  preset: StagePresetId;
  backdropUrl: string | null;
  streams: StageStream[];
};

const DEFAULT_DRAFT: Draft = {
  stageName: '',
  slug: '',
  festieName: '',
  festiePassword: '',
  preset: 'cinema',
  backdropUrl: DEFAULT_STAGE_WALLPAPER_URL,
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

function parseInviteEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

function hasValidInviteEmail(raw: string): boolean {
  return parseInviteEmails(raw).some(isValidNotifyEmail);
}

function StreamPasteTabs({
  mode,
  onChange,
}: {
  mode: StageStreamPasteMode;
  onChange: (mode: StageStreamPasteMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Paste mode"
      style={{
        display: 'flex',
        gap: 6,
        marginBottom: 10,
        fontFamily: 'system-ui,sans-serif',
      }}
    >
      {([
        { mode: 'video' as const, label: 'Video' },
        { mode: 'playlist' as const, label: 'Playlist' },
        { mode: 'channel' as const, label: 'Channel' },
      ]).map(({ mode: tabMode, label }) => {
        const active = mode === tabMode;
        return (
          <button
            key={tabMode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tabMode)}
            style={{
              flex: 1,
              borderRadius: 8,
              padding: '7px 8px',
              fontSize: 12,
              fontWeight: 600,
              border: active
                ? '1px solid rgba(230,126,34,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              background: active ? 'rgba(230,126,34,0.16)' : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
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

function StageShareUrlRow({
  url,
  copied,
  onCopy,
  prominent = false,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  prominent?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: prominent ? '12px 14px' : '8px 10px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily: 'system-ui,sans-serif',
    }}
    >
      <span style={{
        flex: 1,
        minWidth: 0,
        fontSize: prominent ? 13 : 11,
        color: prominent ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.55)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      >
        {url}
      </span>
      <button
        type="button"
        onClick={onCopy}
        style={{
          flexShrink: 0,
          borderRadius: 8,
          padding: prominent ? '6px 12px' : '4px 10px',
          fontSize: prominent ? 12 : 11,
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer',
          fontFamily: 'system-ui,sans-serif',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function BootstrapLoading() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <ModalHero />
      <p style={{
        margin: 0,
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
        fontFamily: 'system-ui,sans-serif',
      }}
      >
        Loading…
      </p>
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
  const [existingStageSlug, setExistingStageSlug] = useState<string | null>(null);
  const [deletingStage, setDeletingStage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamInput, setStreamInput] = useState('');
  const [streamPasteMode, setStreamPasteMode] = useState<StageStreamPasteMode>('video');
  const [streamParsing, setStreamParsing] = useState(false);
  const [streamHint, setStreamHint] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteHint, setInviteHint] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [stageNameTouched, setStageNameTouched] = useState(false);
  const [pendingBackdropFile, setPendingBackdropFile] = useState<File | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backdropFileRef = useRef<HTMLInputElement>(null);
  const backdropBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (backdropBlobUrlRef.current) {
        URL.revokeObjectURL(backdropBlobUrlRef.current);
      }
    };
  }, []);

  const stageNameError = useMemo(() => {
    if (!stageNameTouched && !draft.stageName) return null;
    return validateStageDisplayName(draft.stageName);
  }, [stageNameTouched, draft.stageName]);

  const stageFieldHint = stageDisplayNameHint;
  const stageFieldInvalid = stageNameError != null;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (hasLocalFestieAccount()) setAuthIntent('signin');
      const savedName = getLocalFestieName();
      if (savedName) {
        setDraft(d => ({ ...d, festieName: savedName }));
      }

      let festie = getPlayerSession().festie;
      let authenticated = getPlayerSession().authenticated;

      if (!getPlayerSession().hydrated) {
        const session = await hydratePlayerSession();
        if (cancelled) return;
        festie = session.festie;
        authenticated = session.authenticated;
      }

      if (authenticated && festie) {
        setSignedInFestie(festie);
        setDraft(d => ({ ...d, festieName: festie!.name }));
        try {
          const existing = await fetchMyStage();
          if (cancelled) return;
          if (existing) {
            setExistingStageSlug(existing.slug);
            setError(STAGE_EXISTS_MSG);
            setStep(1);
          } else {
            setStep(2);
          }
        } catch {
          if (!cancelled) setStep(2);
        }
      }

      if (!cancelled) setBootstrapped(true);
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const displayStep = step;

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
      setExistingStageSlug(existing.slug);
      setError(STAGE_EXISTS_MSG);
      return;
    }
    setExistingStageSlug(null);
    setError(null);
    setStep(2);
  };

  const deleteExistingStage = async () => {
    if (!existingStageSlug || deletingStage) return;
    setDeletingStage(true);
    try {
      await takedownUserStage(existingStageSlug);
      setExistingStageSlug(null);
      setError(null);
      if (!signedInFestie) {
        const { authenticated, festie } = await fetchAuthMe();
        if (authenticated && festie) {
          setSignedInFestie(festie);
          setDraft(d => ({ ...d, festieName: festie.name }));
        }
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete stage');
    } finally {
      setDeletingStage(false);
    }
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
    const formatErr = validateStageSlugFormat(slug);
    if (formatErr) {
      setSlugStatus('bad');
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
        return validateStageDisplayName(draft.stageName) == null
          && validateStageSlugFormat(draft.slug) == null
          && slugStatus === 'ok';
      case 3:
        return draft.streams.length > 0;
      default:
        return false;
    }
  };

  const stageDisplayLabel = draft.stageName.trim() || 'your stage';

  const addStream = async () => {
    const url = streamInput.trim();
    if (!url || streamParsing) return;
    const slotsLeft = STAGE_CONFIG.MAX_STREAMS - draft.streams.length;
    if (slotsLeft <= 0) {
      setError(`Maximum ${STAGE_CONFIG.MAX_STREAMS} streams.`);
      return;
    }
    setError(null);
    setStreamHint(null);
    setStreamParsing(true);
    try {
      const result = await parseStageStreams(url, streamPasteMode, {
        existingVideoIds: draft.streams.map(s => s.videoId),
        maxToAdd: slotsLeft,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      if ('stream' in result) {
        if (draft.streams.some(s => s.videoId === result.stream.videoId)) {
          setError('That video is already in your lineup.');
          return;
        }
        setDraft(d => ({ ...d, streams: [...d.streams, result.stream] }));
        setStreamInput('');
        return;
      }

      if (!result.streams.length) {
        setError('No videos could be added.');
        return;
      }

      setDraft(d => ({ ...d, streams: [...d.streams, ...result.streams] }));
      setStreamInput('');
      const added = result.streams.length;
      const skipped = result.skipped;
      setStreamHint(
        skipped > 0
          ? `Added ${added} video${added === 1 ? '' : 's'} (${skipped} skipped).`
          : `Added ${added} video${added === 1 ? '' : 's'}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse videos');
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
        displayName: draft.stageName.trim(),
        preset: draft.preset,
        streams: draft.streams,
      };
      if (draft.preset === 'cinema' && draft.backdropUrl && !pendingBackdropFile) {
        payload.backdropUrl = draft.backdropUrl;
      }
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
      const finalSlug = draft.slug.trim().toLowerCase();
      await createUserStage(payload);
      if (pendingBackdropFile) {
        try {
          await uploadStageBackdrop(finalSlug, pendingBackdropFile);
        } catch (uploadErr) {
          console.warn('[CreateStageWizard] backdrop upload failed, proceeding anyway:', uploadErr);
        }
      }
      router.push(stagePathForSlug(finalSlug));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create stage';
      setError(msg);
      if (msg === STAGE_EXISTS_MSG) {
        try {
          const existing = await fetchMyStage();
          if (existing) setExistingStageSlug(existing.slug);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const stageShareUrl = draft.slug
    ? `${SITE_URL}${stagePathForSlug(draft.slug)}`
    : null;

  const copyStageUrl = async () => {
    if (!stageShareUrl) return;
    try {
      await navigator.clipboard.writeText(stageShareUrl);
      setUrlCopied(true);
      window.setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleStageNameChange = (raw: string) => {
    const stageName = limitStageDisplayNameInput(raw);
    const slug = stageNameToSlug(stageName);
    setDraft(d => ({ ...d, stageName, slug }));
    checkSlugDebounced(slug);
  };

  const handleGalleryChange = ({ preset, backdropUrl }: StageGallerySelection) => {
    if (backdropBlobUrlRef.current) {
      URL.revokeObjectURL(backdropBlobUrlRef.current);
      backdropBlobUrlRef.current = null;
    }
    setPendingBackdropFile(null);
    setDraft(d => ({ ...d, preset, backdropUrl }));
  };

  const handleBackdropPick = async (file: File | undefined) => {
    if (!file || loading) return;
    const validationErr = await validateBackdropFileForUpload(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    if (backdropBlobUrlRef.current) {
      URL.revokeObjectURL(backdropBlobUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    backdropBlobUrlRef.current = previewUrl;
    setPendingBackdropFile(file);
    setDraft(d => ({ ...d, preset: 'cinema', backdropUrl: previewUrl }));
    setError(null);
    if (backdropFileRef.current) backdropFileRef.current.value = '';
  };

  const handleInvite = () => {
    if (!hasValidInviteEmail(inviteEmails)) return;
    setInviteHint('Invites queued — email sending is coming soon.');
  };

  const canInvite = hasValidInviteEmail(inviteEmails);
  const modalWidth = displayStep === 1 ? MODAL_WIDTH_AUTH : MODAL_WIDTH_SETUP;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.36)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      animation: 'wlc-fade-in 0.45s ease',
      padding: 16,
      fontFamily: "Georgia,'Times New Roman',serif",
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
      }}>
        <ProgressBar step={bootstrapped ? displayStep : 0} />

        <div style={{
          padding: !bootstrapped || displayStep === 1 ? (mobile ? '28px 22px 24px' : '32px 36px 28px') : '28px 28px 24px',
          color: 'rgba(255,255,255,0.9)',
          ...(displayStep === 2 || displayStep === 3 ? {
            maxHeight: 'min(82vh, 920px)',
            overflowY: 'auto' as const,
            scrollbarWidth: 'thin' as const,
          } : {}),
        }}>
          {!bootstrapped ? (
            <BootstrapLoading />
          ) : (
            <>
          {displayStep === 1 ? <ModalHero /> : <StepHeader />}

          {displayStep === 1 && (
            <>
              {forgotPasswordOpen ? (
                <ForgotPasswordPanel
                  initialName={draft.festieName}
                  onBack={() => setForgotPasswordOpen(false)}
                />
              ) : (
                <>
              {!signedInFestie && (
                <AuthTabs
                  authIntent={authIntent}
                  onChange={mode => {
                    setAuthIntent(mode);
                    setError(null);
                    setForgotPasswordOpen(false);
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

              {!signedInFestie && authIntent === 'signin' && (
                <p style={{
                  margin: '0 0 12px',
                  textAlign: 'center',
                  fontFamily: 'system-ui,sans-serif',
                }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setForgotPasswordOpen(true);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      fontSize: 13,
                      color: 'rgba(126,184,255,0.9)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontFamily: 'inherit',
                    }}
                  >
                    Forgot password?
                  </button>
                </p>
              )}

              {displayStep === 1 && error && (
                <>
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
                  {error === STAGE_EXISTS_MSG && existingStageSlug && (
                    <button
                      type="button"
                      onClick={() => void deleteExistingStage()}
                      disabled={deletingStage}
                      style={{
                        width: '100%',
                        marginTop: 10,
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        border: '1px solid rgba(255,107,107,0.35)',
                        background: 'rgba(255,107,107,0.08)',
                        color: '#ff9d9d',
                        cursor: deletingStage ? 'wait' : 'pointer',
                        fontFamily: 'system-ui,sans-serif',
                      }}
                    >
                      {deletingStage
                        ? 'Deleting…'
                        : `Delete existing stage (${existingStageSlug})`}
                    </button>
                  )}
                </>
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
            </>
          )}

          {displayStep === 2 && (
            <>
              <h1 style={STEP_TITLE}>
                Set up your stage
              </h1>
              
              <label style={LABEL}>Stage name</label>
              <input
                style={{
                  ...INPUT,
                  border: stageFieldInvalid
                    ? '1px solid rgba(255,107,107,0.55)'
                    : INPUT.border,
                }}
                value={draft.stageName}
                onChange={e => handleStageNameChange(e.target.value)}
                onBlur={() => setStageNameTouched(true)}
                placeholder="Sunset Rooftop"
                autoFocus
                spellCheck={false}
                maxLength={STAGE_CONFIG.DISPLAY_NAME_MAX_LENGTH}
              />
              <p style={{
                margin: '6px 0 0',
                fontSize: 11,
                color: stageFieldInvalid ? '#ff6b6b' : 'rgba(255,255,255,0.45)',
                fontFamily: 'system-ui,sans-serif',
              }}
              >
                {stageFieldHint}
              </p>
              {slugStatus === 'checking' && (
                <p style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  fontFamily: 'system-ui,sans-serif',
                  color: 'rgba(255,255,255,0.55)',
                }}
                >
                  Checking…
                </p>
              )}
              {slugMessage && slugStatus === 'bad' && !stageFieldInvalid && (
                <p style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  fontFamily: 'system-ui,sans-serif',
                  color: '#ff6b6b',
                }}
                >
                  {slugMessage}
                </p>
              )}
              {slugMessage && slugStatus === 'ok' && (
                <p style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  fontFamily: 'system-ui,sans-serif',
                  color: '#6fcf97',
                }}
                >
                  {slugMessage}
                </p>
              )}

              <label style={{ ...LABEL, marginTop: 24 }}>Choose your scene</label>
              
              <StageSceneGallery
                compact
                columns={mobile ? 2 : 4}
                preset={draft.preset}
                backdropUrl={draft.backdropUrl}
                disabled={loading}
                onChange={handleGalleryChange}
                onUploadClick={() => backdropFileRef.current?.click()}
                uploadLabel="Upload image"
              />
              <input
                ref={backdropFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={e => void handleBackdropPick(e.target.files?.[0])}
              />
              <p style={{
                margin: '8px 0 0',
                fontSize: 11,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'system-ui,sans-serif',
              }}
              >
                {stageBackdropUploadHint()}
              </p>
            </>
          )}

          {displayStep === 3 && (
            <>
              <h1 style={STEP_TITLE}>
                Who&apos;s playing at {stageDisplayLabel}?
              </h1>
              <p style={STEP_SUB}>
                Add YouTube videos, playlists, or channels.
              </p>

              <StreamPasteTabs
                mode={streamPasteMode}
                onChange={mode => {
                  setStreamPasteMode(mode);
                  setError(null);
                  setStreamHint(null);
                }}
              />
              <p style={{
                margin: '0 0 12px',
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'system-ui,sans-serif',
              }}
              >
                {streamPasteMode === 'video' && 'Paste your YouTube video link.'}
                {streamPasteMode === 'playlist' && 'Paste a playlist link — we import embeddable videos (up to your lineup limit).'}
                {streamPasteMode === 'channel' && 'Paste a channel link or @handle — we import recent uploads.'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  style={{ ...INPUT, flex: 1 }}
                  value={streamInput}
                  onChange={e => setStreamInput(e.target.value)}
                  placeholder={
                    streamPasteMode === 'video'
                      ? 'https://youtube.com/watch?v=…'
                      : streamPasteMode === 'playlist'
                        ? 'https://youtube.com/playlist?list=…'
                        : 'https://youtube.com/@channel'
                  }
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
                  {streamParsing ? '…' : streamPasteMode === 'video' ? 'Add' : 'Import'}
                </button>
              </div>
              {streamHint && (
                <p style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  color: '#6fcf97',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}
                >
                  {streamHint}
                </p>
              )}
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
                  Add at least one YouTube link. You can update this later. 
                </p>
              )}
            </>
          )}

          {displayStep === 4 && (
            <>
              <h1 style={STEP_TITLE}>
                Invite friends
              </h1>
              
              {stageShareUrl && (
                <div style={{ marginBottom: 24 }}>
                  <label style={LABEL}>Share your stage link</label>
                  <StageShareUrlRow
                    url={stageShareUrl}
                    copied={urlCopied}
                    onCopy={() => void copyStageUrl()}
                    prominent
                  />
                </div>
              )}
              <label style={LABEL}>Email invites (Paste one email per line or comma-separated)</label>
              <textarea
                value={inviteEmails}
                onChange={e => {
                  setInviteEmails(e.target.value);
                  setInviteHint(null);
                }}
                placeholder={'friend@example.com\ncrew@example.com'}
                rows={5}
                style={{
                  ...INPUT,
                  resize: 'vertical',
                  minHeight: 110,
                  lineHeight: 1.45,
                }}
              />
              <button
                type="button"
                onClick={handleInvite}
                disabled={!canInvite}
                style={{
                  marginTop: 12,
                  width: 'fit-content',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: canInvite ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                  color: canInvite ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.35)',
                  cursor: canInvite ? 'pointer' : 'default',
                  fontFamily: 'system-ui,sans-serif',
                }}
              >
                Invite
              </button>
              {inviteHint && (
                <p style={{
                  margin: '10px 0 0',
                  fontSize: 12,
                  color: '#6fcf97',
                  fontFamily: 'system-ui,sans-serif',
                  textAlign: 'center',
                }}
                >
                  {inviteHint}
                </p>
              )}
             
            </>
          )}

          {error && displayStep !== 1 && (
            <>
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
              {error === STAGE_EXISTS_MSG && existingStageSlug && (
                <button
                  type="button"
                  onClick={() => void deleteExistingStage()}
                  disabled={deletingStage}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid rgba(255,107,107,0.35)',
                    background: 'rgba(255,107,107,0.08)',
                    color: '#ff9d9d',
                    cursor: deletingStage ? 'wait' : 'pointer',
                    fontFamily: 'system-ui,sans-serif',
                  }}
                >
                  {deletingStage
                    ? 'Deleting…'
                    : `Delete existing stage (${existingStageSlug})`}
                </button>
              )}
            </>
          )}

          {displayStep === 2 && (
            <button
              type="button"
              disabled={!canAdvance() || loading}
              onClick={() => {
                setError(null);
                setStep(3);
              }}
              style={{
                ...PRIMARY_BTN,
                marginTop: 24,
                cursor: canAdvance() && !loading ? 'pointer' : 'default',
                background: canAdvance() && !loading
                  ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canAdvance() ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              Continue →
            </button>
          )}

          {displayStep === 3 && (
            <button
              type="button"
              disabled={!canAdvance() || loading}
              onClick={() => {
                setError(null);
                setStep(4);
              }}
              style={{
                ...PRIMARY_BTN,
                marginTop: 24,
                cursor: canAdvance() && !loading ? 'pointer' : 'default',
                background: canAdvance() && !loading
                  ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: canAdvance() ? '#fff' : 'rgba(255,255,255,0.35)',
              }}
            >
              Continue →
            </button>
          )}

          {displayStep === 4 && (
            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  void handleCreate();
                }}
                style={{
                  ...PRIMARY_BTN,
                  cursor: loading ? 'default' : 'pointer',
                  background: !loading
                    ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: !loading ? '#fff' : 'rgba(255,255,255,0.35)',
                }}
              >
                {loading ? 'Creating…' : 'Create stage'}
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
