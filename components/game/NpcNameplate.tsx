'use client';

import { useState } from 'react';

type NpcNameplateProps = {
  displayName: string;
  modelDisplayName?: string;
};

/** Two-line nameplate — model line tappable on narrow viewports. */
export function NpcNameplate({ displayName, modelDisplayName }: NpcNameplateProps) {
  const [showModel, setShowModel] = useState(false);
  const hasModel = Boolean(modelDisplayName?.trim());

  return (
    <button
      type="button"
      className="game-npc-nameplate"
      onClick={() => { if (hasModel) setShowModel(v => !v); }}
      aria-label={hasModel ? `${displayName}, ${modelDisplayName}` : displayName}
    >
      <span className="game-npc-nameplate-primary">{displayName}</span>
      {hasModel && (
        <span
          className={`game-npc-nameplate-model${showModel ? ' is-visible' : ''}`}
        >
          {modelDisplayName}
        </span>
      )}
    </button>
  );
}
