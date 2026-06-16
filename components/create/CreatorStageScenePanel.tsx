'use client';

import { useRef, useState } from 'react';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import { updateUserStage, uploadStageBackdrop } from '@/lib/stages/client';
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

  if (!ctx?.isOwner) return null;

  const { stage, setStage } = ctx;
  const isCityTemplate = stage.preset === 'cinema';

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
      setStage(updated);
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
      setStage(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section>
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
