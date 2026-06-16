'use client';

import { useEffect, useRef } from 'react';
import { tryShuffleOnStageStart } from '@/lib/stages/client';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';

/** When shuffle-on-start is enabled, first viewer in an empty room gets a random track. */
export function useCreatorStageShuffleOnStart(
  slug: string | null | undefined,
  shuffleOnStart: boolean,
  multiplayerConnected: boolean,
): void {
  const ctx = useCreatorStageControls();
  const triedRef = useRef(false);

  useEffect(() => {
    triedRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!slug || !shuffleOnStart || !multiplayerConnected || triedRef.current || !ctx) return;

    const timer = window.setTimeout(() => {
      if (triedRef.current) return;
      triedRef.current = true;
      void tryShuffleOnStageStart(slug)
        .then(result => {
          if (result?.shuffled) {
            ctx.setStage(result.stage);
          }
        })
        .catch(() => {
          /* non-blocking — stage still plays saved index */
        });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [slug, shuffleOnStart, multiplayerConnected, ctx]);
}
