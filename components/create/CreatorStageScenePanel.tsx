'use client';

import { useEffect, useRef, useState } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { updateUserStage, uploadStageBackdrop } from '@/lib/stages/client';
import {
  limitStageDescriptionInput,
  normalizeStageDescription,
  STAGE_DESCRIPTION_FIELD_HINT,
  validateStageDescription,
} from '@/lib/stages/stageDescription';
import { STAGE_CONFIG } from '@/lib/stages/config';
import {
  stageBackdropUploadHint,
  validateBackdropFileForUpload,
} from '@/lib/stages/backdropValidation';
import { normalizeBackdropPath } from '@/lib/stages/wallpapers';
import { StageSceneGallery, type StageGallerySelection } from '@/components/create/StageSceneGallery';

export function CreatorStageScenePanel() {
  const ctx = useCreatorStageControls();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [descriptionDirty, setDescriptionDirty] = useState(false);

  const stage = ctx?.stage;
  const slug = stage?.slug;
  const stageDescription = stage?.description;

  useEffect(() => {
    if (!slug) return;
    setDescription(stageDescription ?? '');
    setDescriptionDirty(false);
  }, [slug, stageDescription]);

  if (!ctx?.isOwner || !stage) return null;

  const { setStage } = ctx;
  const isCityTemplate = stage.preset === 'cinema';

  const saveDescription = async () => {
    if (busy) return;
    const normalized = normalizeStageDescription(description);
    const current = normalizeStageDescription(stage.description ?? '');
    if (normalized === current) {
      setDescriptionDirty(false);
      return;
    }
    const validationErr = validateStageDescription(description);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateUserStage(stage.slug, { description: normalized });
      setStage(updated, { broadcast: false });
      setDescriptionDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save description');
    } finally {
      setBusy(false);
    }
  };

  const handleGalleryPick = async ({ preset, backdropUrl }: StageGallerySelection) => {
    if (busy) return;
    const samePreset = stage.preset === preset;
    const sameBackdrop = preset !== 'cinema'
      || normalizeBackdropPath(stage.backdropUrl ?? '') === normalizeBackdropPath(backdropUrl ?? '');
    if (samePreset && sameBackdrop) return;

    setBusy(true);
    setError(null);
    try {
      const patch: Parameters<typeof updateUserStage>[1] = { preset };
      if (preset === 'cinema') patch.backdropUrl = backdropUrl;
      else patch.backdropUrl = null;
      const updated = await updateUserStage(stage.slug, patch);
      setStage(updated, { broadcast: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change scene');
    } finally {
      setBusy(false);
    }
  };

  const handleBackdropPick = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const validationErr = await validateBackdropFileForUpload(file);
      if (validationErr) {
        setError(validationErr);
        return;
      }
      const updated = await uploadStageBackdrop(stage.slug, file);
      setStage(updated, { broadcast: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
        Short description
      </label>
      <textarea
        value={description}
        disabled={busy}
        onChange={e => {
          setDescription(limitStageDescriptionInput(e.target.value));
          setDescriptionDirty(true);
          setError(null);
        }}
        placeholder="Late-night rooftop sets with friends."
        rows={3}
        maxLength={STAGE_CONFIG.DESCRIPTION_MAX_LENGTH}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: '#fff',
          padding: '8px 10px',
          fontSize: 12,
          lineHeight: 1.45,
          resize: 'vertical',
          marginBottom: 8,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          disabled={busy || !descriptionDirty}
          onClick={() => void saveDescription()}
          style={{
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 700,
            border: 'none',
            background: descriptionDirty && !busy
              ? 'linear-gradient(180deg, #ffb347 0%, #e67e22 100%)'
              : 'rgba(255,255,255,0.08)',
            color: descriptionDirty && !busy ? '#fff' : 'rgba(255,255,255,0.35)',
            cursor: busy ? 'wait' : descriptionDirty ? 'pointer' : 'default',
          }}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.45)' }}>
          {STAGE_DESCRIPTION_FIELD_HINT}
        </p>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.5)' }}>
        Pick a stage backdrop.
      </p>
      <StageSceneGallery
        preset={stage.preset}
        backdropUrl={stage.backdropUrl}
        disabled={busy}
        onChange={selection => void handleGalleryPick(selection)}
        onUploadClick={
          isCityTemplate ? () => fileRef.current?.click() : undefined
        }
        uploadLabel="Upload image"
      />
      {isCityTemplate && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={e => void handleBackdropPick(e.target.files?.[0])}
          />
          <p style={{
            margin: '10px 0 0',
            fontSize: 11,
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.4)',
          }}
          >
            {stageBackdropUploadHint()}
          </p>
        </>
      )}
      {error && (
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#ff6b6b' }}>{error}</p>
      )}
    </section>
  );
}
